import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-user-" + userId,
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// Mock the database module
vi.mock("./db", () => ({
  getSession: vi.fn(),
  getUserSessions: vi.fn(),
  getSessionPersonas: vi.fn(),
  getSessionCritiques: vi.fn(),
  getSessionResearchLogs: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

import {
  getSession,
  getUserSessions,
  getSessionPersonas,
  getSessionCritiques,
  getSessionResearchLogs,
} from "./db";

const mockGetSession = vi.mocked(getSession);
const mockGetUserSessions = vi.mocked(getUserSessions);
const mockGetSessionPersonas = vi.mocked(getSessionPersonas);
const mockGetSessionCritiques = vi.mocked(getSessionCritiques);
const mockGetSessionResearchLogs = vi.mocked(getSessionResearchLogs);

describe("warRoom.listSessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns sessions for the authenticated user", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const mockSessions = [
      {
        id: 1,
        userId: 1,
        documentTitle: "Test Strategy",
        documentContent: "Some content",
        contextData: {},
        robustnessScore: 72,
        status: "complete" as const,
        unhingedMode: "off" as const,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
      },
      {
        id: 2,
        userId: 1,
        documentTitle: "Another Strategy",
        documentContent: "More content",
        contextData: {},
        robustnessScore: null,
        status: "researching" as const,
        unhingedMode: "off" as const,
        createdAt: new Date("2026-01-02"),
        updatedAt: new Date("2026-01-02"),
      },
    ];

    mockGetUserSessions.mockResolvedValue(mockSessions);

    const result = await caller.warRoom.listSessions();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 1,
      documentTitle: "Test Strategy",
      robustnessScore: 72,
      status: "complete",
      createdAt: new Date("2026-01-01"),
    });
    expect(result[1]).toEqual({
      id: 2,
      documentTitle: "Another Strategy",
      robustnessScore: null,
      status: "researching",
      createdAt: new Date("2026-01-02"),
    });
    expect(mockGetUserSessions).toHaveBeenCalledWith(1);
  });

  it("rejects unauthenticated requests", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.warRoom.listSessions()).rejects.toThrow();
  });
});

describe("warRoom.getSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns full session data for the owner", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const mockSession = {
      id: 1,
      userId: 1,
      documentTitle: "Test Strategy",
      documentContent: "Some content",
      contextData: {},
      robustnessScore: 65,
      status: "complete" as const,
      unhingedMode: "off" as const,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    };

    const mockPersonas = [
      {
        id: 1,
        sessionId: 1,
        name: "The CFO",
        role: "Chief Financial Officer",
        perspective: "Focused on ROI",
        researchContext: "Industry data...",
        avatarStyle: "chart",
        createdAt: new Date("2026-01-01"),
      },
    ];

    const mockCritiques = [
      {
        id: 1,
        sessionId: 1,
        personaId: 1,
        title: "Revenue Gap",
        attack: "The projections are too optimistic",
        citation: "Industry report 2025",
        citationUrl: "https://example.com",
        suggestedFix: "Reduce projections by 20%",
        severity: "high" as const,
        confidenceScore: 85,
        confidenceReason: "Based on industry benchmarks",
        unhingedAttack: "These numbers are fantasy",
        documentSection: "Financial Projections",
        createdAt: new Date("2026-01-01"),
      },
    ];

    mockGetSession.mockResolvedValue(mockSession);
    mockGetSessionPersonas.mockResolvedValue(mockPersonas);
    mockGetSessionCritiques.mockResolvedValue(mockCritiques);

    const result = await caller.warRoom.getSession({ sessionId: 1 });

    expect(result).not.toBeNull();
    expect(result!.id).toBe(1);
    expect(result!.documentTitle).toBe("Test Strategy");
    expect(result!.robustnessScore).toBe(65);
    expect(result!.personas).toHaveLength(1);
    expect(result!.personas[0].name).toBe("The CFO");
    expect(result!.personas[0].avatarStyle).toBe("chart");
    expect(result!.critiques).toHaveLength(1);
    expect(result!.critiques[0].title).toBe("Revenue Gap");
    expect(result!.critiques[0].personaName).toBe("The CFO");
    expect(result!.critiques[0].severity).toBe("high");
    expect(result!.critiques[0].confidenceScore).toBe(85);
    expect(result!.critiques[0].unhingedAttack).toBe("These numbers are fantasy");
  });

  it("returns null for a session owned by another user", async () => {
    const ctx = createAuthContext(2); // Different user
    const caller = appRouter.createCaller(ctx);

    const mockSession = {
      id: 1,
      userId: 1, // Owned by user 1
      documentTitle: "Test Strategy",
      documentContent: "Some content",
      contextData: {},
      robustnessScore: 65,
      status: "complete" as const,
      unhingedMode: "off" as const,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    };

    mockGetSession.mockResolvedValue(mockSession);

    const result = await caller.warRoom.getSession({ sessionId: 1 });
    expect(result).toBeNull();
  });

  it("returns null for a non-existent session", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    mockGetSession.mockResolvedValue(undefined);

    const result = await caller.warRoom.getSession({ sessionId: 999 });
    expect(result).toBeNull();
  });

  it("rejects unauthenticated requests", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.warRoom.getSession({ sessionId: 1 })).rejects.toThrow();
  });
});

describe("warRoom.getResearchLogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns research logs for the session owner", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const mockSession = {
      id: 1,
      userId: 1,
      documentTitle: "Test",
      documentContent: "Content",
      contextData: {},
      robustnessScore: null,
      status: "researching" as const,
      unhingedMode: "off" as const,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    };

    const mockLogs = [
      {
        id: 1,
        sessionId: 1,
        message: "Researching industry...",
        logType: "search" as const,
        createdAt: new Date("2026-01-01"),
      },
      {
        id: 2,
        sessionId: 1,
        message: "Research complete",
        logType: "complete" as const,
        createdAt: new Date("2026-01-01"),
      },
    ];

    mockGetSession.mockResolvedValue(mockSession);
    mockGetSessionResearchLogs.mockResolvedValue(mockLogs);

    const result = await caller.warRoom.getResearchLogs({ sessionId: 1 });

    expect(result).toHaveLength(2);
    expect(result[0].message).toBe("Researching industry...");
    expect(result[1].logType).toBe("complete");
  });

  it("returns empty array for another user's session", async () => {
    const ctx = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);

    const mockSession = {
      id: 1,
      userId: 1,
      documentTitle: "Test",
      documentContent: "Content",
      contextData: {},
      robustnessScore: null,
      status: "researching" as const,
      unhingedMode: "off" as const,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    };

    mockGetSession.mockResolvedValue(mockSession);

    const result = await caller.warRoom.getResearchLogs({ sessionId: 1 });
    expect(result).toEqual([]);
  });

  it("rejects unauthenticated requests", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.warRoom.getResearchLogs({ sessionId: 1 })).rejects.toThrow();
  });
});
