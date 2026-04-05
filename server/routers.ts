import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getSession,
  getUserSessions,
  getSessionPersonas,
  getSessionCritiques,
  getSessionResearchLogs,
} from "./db";
import type { ContextFormData, PersonaData, CritiqueData, SessionSummary } from "@shared/types";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  warRoom: router({
    /** Get a specific session with all its data */
    getSession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input, ctx }): Promise<SessionSummary | null> => {
        const session = await getSession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) return null;

        const sessionPersonas = await getSessionPersonas(session.id);
        const sessionCritiques = await getSessionCritiques(session.id);

        const personaMap = new Map(sessionPersonas.map(p => [p.id, p]));

        return {
          id: session.id,
          documentTitle: session.documentTitle,
          robustnessScore: session.robustnessScore,
          status: session.status,
          personas: sessionPersonas.map(p => ({
            id: p.id,
            name: p.name,
            role: p.role,
            perspective: p.perspective,
            avatarStyle: p.avatarStyle || "shield",
          })),
          critiques: sessionCritiques.map(c => {
            const persona = personaMap.get(c.personaId);
            return {
              id: c.id,
              personaId: c.personaId,
              personaName: persona?.name || "Unknown",
              personaRole: persona?.role || "Unknown",
              title: c.title,
              attack: c.attack,
              citation: c.citation,
              citationUrl: c.citationUrl,
              suggestedFix: c.suggestedFix,
              severity: c.severity,
              confidenceScore: c.confidenceScore,
              confidenceReason: c.confidenceReason,
              unhingedAttack: c.unhingedAttack,
              documentSection: c.documentSection,
            };
          }),
          createdAt: session.createdAt,
        };
      }),

    /** List all sessions for the current user */
    listSessions: protectedProcedure.query(async ({ ctx }) => {
      const userSessions = await getUserSessions(ctx.user.id);
      return userSessions.map(s => ({
        id: s.id,
        documentTitle: s.documentTitle,
        robustnessScore: s.robustnessScore,
        status: s.status,
        createdAt: s.createdAt,
      }));
    }),

    /** Get research logs for a session */
    getResearchLogs: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input, ctx }) => {
        const session = await getSession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) return [];
        return getSessionResearchLogs(input.sessionId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
