import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  sessions, InsertSession, Session,
  personas, InsertPersona, Persona,
  critiques, InsertCritique, Critique,
  researchLogs, InsertResearchLog, ResearchLog,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================
// USER QUERIES (from scaffold)
// ============================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================
// SESSION QUERIES
// ============================================================

export async function createSession(data: InsertSession): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sessions).values(data);
  return result[0].insertId;
}

export async function getSession(id: number): Promise<Session | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  return result[0];
}

export async function updateSessionStatus(id: number, status: Session["status"], robustnessScore?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Partial<Session> = { status };
  if (robustnessScore !== undefined) {
    updateData.robustnessScore = robustnessScore;
  }
  await db.update(sessions).set(updateData).where(eq(sessions.id, id));
}

export async function getUserSessions(userId: number): Promise<Session[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(sessions).where(eq(sessions.userId, userId));
}

// ============================================================
// PERSONA QUERIES
// ============================================================

export async function createPersona(data: InsertPersona): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(personas).values(data);
  return result[0].insertId;
}

export async function getSessionPersonas(sessionId: number): Promise<Persona[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(personas).where(eq(personas.sessionId, sessionId));
}

// ============================================================
// CRITIQUE QUERIES
// ============================================================

export async function createCritique(data: InsertCritique): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(critiques).values(data);
  return result[0].insertId;
}

export async function getSessionCritiques(sessionId: number): Promise<Critique[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(critiques).where(eq(critiques.sessionId, sessionId));
}

// ============================================================
// RESEARCH LOG QUERIES
// ============================================================

export async function createResearchLog(data: InsertResearchLog): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(researchLogs).values(data);
  return result[0].insertId;
}

export async function getSessionResearchLogs(sessionId: number): Promise<ResearchLog[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(researchLogs).where(eq(researchLogs.sessionId, sessionId));
}
