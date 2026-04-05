/**
 * SSE Route for War Room Analysis
 * 
 * This is a custom Express route (not tRPC) because tRPC doesn't natively
 * support Server-Sent Events with the streaming pattern we need.
 * 
 * POST /api/war-room/analyze — starts analysis and streams SSE events
 */

import type { Express, Request, Response } from "express";
import { runAnalysis } from "./orchestrator";
import { sdk } from "./_core/sdk";
import type { ContextFormData } from "@shared/types";

export function registerWarRoomRoutes(app: Express) {
  app.post("/api/war-room/analyze", async (req: Request, res: Response) => {
    // Authenticate using the SDK
    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { documentTitle, documentContent, contextData } = req.body as {
      documentTitle: string;
      documentContent: string;
      contextData: ContextFormData;
    };

    if (!documentTitle || !documentContent || !contextData) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Set up SSE
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    const emit = (type: string, data: unknown) => {
      const event = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
      res.write(`data: ${event}\n\n`);
    };

    try {
      const result = await runAnalysis(
        user.id,
        documentTitle,
        documentContent,
        contextData,
        emit
      );

      // Final event
      emit("done", { sessionId: result.sessionId });
      res.end();
    } catch (error) {
      emit("error", { message: error instanceof Error ? error.message : "Analysis failed" });
      res.end();
    }
  });
}
