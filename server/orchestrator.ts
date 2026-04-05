/**
 * War Room Orchestrator
 * 
 * Coordinates the full analysis pipeline:
 * 1. Parse document
 * 2. Research industry context
 * 3. Generate personas
 * 4. Generate critiques (one per persona)
 * 5. Moderate and filter critiques
 * 6. Generate unhinged rewrites
 * 7. Calculate robustness score
 */

import {
  generateResearchContext,
  generatePersonas,
  generateCritiques,
  moderateCritiques,
  rewriteUnhinged,
  generateDebateScript,
  type GeneratedPersona,
  type GeneratedCritique,
} from "./agents";
import { generateSpeech, getVoiceIdForPersona, getEmotionSettings } from "./elevenlabs";
import { storagePut } from "./storage";
import {
  createSession,
  createPersona,
  createCritique,
  createResearchLog,
  updateSessionStatus,
} from "./db";
import type { ContextFormData, CritiqueData, PersonaData, DebateTurn } from "@shared/types";

export type EventEmitter = (type: string, data: unknown) => void;

/**
 * Run the full War Room analysis pipeline.
 * Emits SSE events throughout for the live terminal.
 */
export async function runAnalysis(
  userId: number,
  documentTitle: string,
  documentContent: string,
  contextData: ContextFormData,
  emit: EventEmitter
): Promise<{ sessionId: number }> {
  // Step 1: Create session
  const sessionId = await createSession({
    userId,
    documentTitle,
    documentContent,
    contextData,
    status: "researching",
  });

  emit("research_log", { message: `> Session initialized. Analyzing "${documentTitle}"...`, logType: "analyze" });

  try {
    // Step 2: Research industry context
    emit("research_log", { message: `> Researching ${contextData.industry} industry dynamics...`, logType: "search" });
    await createResearchLog({ sessionId, message: `Researching ${contextData.industry} industry dynamics`, logType: "search" });

    const geo = contextData.geography || "global";
    emit("research_log", { message: `> Executing query: "${contextData.industry} market size ${geo} 2026"`, logType: "search" });
    emit("research_log", { message: `> Executing query: "${geo} regulatory framework ${contextData.industry} foreign ownership"`, logType: "search" });
    emit("research_log", { message: `> Executing query: "${contextData.industry} competitive landscape ${geo} M&A trends"`, logType: "search" });
    emit("research_log", { message: `> Analyzing regulatory environment for ${contextData.companySize} companies in ${geo}...`, logType: "search" });

    const researchContext = await generateResearchContext(contextData);

    emit("research_log", { message: `> Industry research complete. ${researchContext.length} chars of context generated.`, logType: "complete" });
    await createResearchLog({ sessionId, message: `Industry research complete`, logType: "complete" });

    // Step 3: Generate personas
    await updateSessionStatus(sessionId, "generating");
    emit("research_log", { message: `> Generating stakeholder personas based on ${contextData.stakeholderArchetypes.length} archetypes...`, logType: "analyze" });

    const generatedPersonas = await generatePersonas(contextData, researchContext);

    // Save personas to DB and emit events
    const savedPersonas: { dbId: number; generated: GeneratedPersona }[] = [];
    for (const gp of generatedPersonas) {
      const personaId = await createPersona({
        sessionId,
        name: gp.name,
        role: gp.role,
        perspective: gp.perspective,
        researchContext: researchContext.slice(0, 2000),
        avatarStyle: gp.avatarStyle,
      });

      savedPersonas.push({ dbId: personaId, generated: gp });

      const personaData: PersonaData = {
        id: personaId,
        name: gp.name,
        role: gp.role,
        perspective: gp.perspective,
        avatarStyle: gp.avatarStyle,
      };
      emit("persona_created", personaData);
      emit("research_log", { message: `> Persona created: ${gp.name} — "${gp.perspective}"`, logType: "inject" });
    }

    // Step 4: Generate critiques from each persona
    emit("research_log", { message: `> Initiating document review by ${savedPersonas.length} stakeholder personas...`, logType: "analyze" });

    const allCritiques: { personaName: string; personaRole: string; personaId: number; critique: GeneratedCritique }[] = [];

    for (const sp of savedPersonas) {
      emit("research_log", { message: `> ${sp.generated.name} is reviewing the document...`, logType: "analyze" });

      const personaCritiques = await generateCritiques(sp.generated, documentContent, researchContext);

      for (const c of personaCritiques) {
        allCritiques.push({
          personaName: sp.generated.name,
          personaRole: sp.generated.role,
          personaId: sp.dbId,
          critique: c,
        });
      }

      emit("research_log", { message: `> ${sp.generated.name} submitted ${personaCritiques.length} critiques.`, logType: "complete" });
    }

    // Step 5: Moderate critiques
    emit("research_log", { message: `> Moderator filtering ${allCritiques.length} critiques for quality and relevance...`, logType: "analyze" });

    const moderationResult = await moderateCritiques(
      allCritiques.map(c => ({ personaName: c.personaName, critique: c.critique })),
      documentContent
    );

    const survivingCritiques = moderationResult.survivingCritiqueIndices
      .map(i => allCritiques[i])
      .filter(Boolean)
      .slice(0, 3); // PRD: enforce exactly top 3

    emit("research_log", { message: `> ${allCritiques.length} critiques reviewed. Top ${survivingCritiques.length} most damaging vulnerabilities selected.`, logType: "complete" });

    // Step 6: Generate unhinged rewrites
    emit("research_log", { message: `> Generating Unhinged Mode rewrites...`, logType: "analyze" });

    const unhingedRewrites = await rewriteUnhinged(
      survivingCritiques.map(c => ({ title: c.critique.title, attack: c.critique.attack }))
    );

    emit("research_log", { message: `> Unhinged Mode rewrites complete.`, logType: "complete" });

    // Step 6.5: Generate Boardroom Debate
    emit("research_log", { message: `> Generating boardroom debate script...`, logType: "analyze" });

    const debatePersonas = savedPersonas.map(sp => ({
      name: sp.generated.name,
      role: sp.generated.role,
      perspective: sp.generated.perspective,
    }));

    const debateCritiques = survivingCritiques.map(sc => ({
      personaName: sc.personaName,
      title: sc.critique.title,
      attack: sc.critique.attack,
    }));

    // Generate both standard and unhinged debate scripts
    const debateScript = await generateDebateScript(debatePersonas, debateCritiques, false);
    emit("research_log", { message: `> Debate script ready. ${debateScript.length} turns generated.`, logType: "complete" });

    // Generate audio for each turn using ElevenLabs
    const debateTurns: DebateTurn[] = [];
    for (let i = 0; i < debateScript.length; i++) {
      const turn = debateScript[i];
      const voiceId = getVoiceIdForPersona(turn.speaker);
      emit("research_log", { message: `> Synthesizing voice: ${turn.speaker} (turn ${i + 1}/${debateScript.length})...`, logType: "analyze" });

      let audioUrl: string | undefined;
      try {
        const emotionSettings = getEmotionSettings(turn.emotion, false);
        const audioBuffer = await generateSpeech(turn.text, {
          voiceId,
          ...emotionSettings,
        });

        // Upload to S3
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileKey = `debate-audio/${sessionId}/turn-${i}-${randomSuffix}.mp3`;
        const { url } = await storagePut(fileKey, audioBuffer, "audio/mpeg");
        audioUrl = url;
      } catch (err) {
        console.error(`[Orchestrator] TTS failed for turn ${i}:`, err);
        // Continue without audio — frontend will fall back to text-only
      }

      const debateTurn: DebateTurn = {
        index: i,
        speaker: turn.speaker,
        voiceId,
        text: turn.text,
        emotion: turn.emotion,
        audioUrl,
      };

      debateTurns.push(debateTurn);
      emit("debate_turn", debateTurn);
    }

    emit("research_log", { message: `> Boardroom debate ready. ${debateTurns.filter(t => t.audioUrl).length}/${debateTurns.length} turns with audio.`, logType: "complete" });
    emit("debate_ready", { turns: debateTurns, isUnhinged: false, totalDurationEstimate: debateTurns.length * 5 });

    // Step 7: Save critiques to DB and emit
    const savedCritiques: CritiqueData[] = [];
    for (let i = 0; i < survivingCritiques.length; i++) {
      const sc = survivingCritiques[i];
      const critiqueId = await createCritique({
        sessionId,
        personaId: sc.personaId,
        title: sc.critique.title,
        attack: sc.critique.attack,
        citation: sc.critique.citation || null,
        citationUrl: sc.critique.citationUrl || null,
        suggestedFix: sc.critique.suggestedFix,
        severity: sc.critique.severity,
        confidenceScore: sc.critique.confidenceScore,
        confidenceReason: sc.critique.confidenceReason || null,
        unhingedAttack: unhingedRewrites[i] || null,
        documentSection: sc.critique.documentSection || null,
      });

      const critiqueData: CritiqueData = {
        id: critiqueId,
        personaId: sc.personaId,
        personaName: sc.personaName,
        personaRole: sc.personaRole,
        title: sc.critique.title,
        attack: sc.critique.attack,
        citation: sc.critique.citation || null,
        citationUrl: sc.critique.citationUrl || null,
        suggestedFix: sc.critique.suggestedFix,
        severity: sc.critique.severity,
        confidenceScore: sc.critique.confidenceScore,
        confidenceReason: sc.critique.confidenceReason || null,
        unhingedAttack: unhingedRewrites[i] || null,
        documentSection: sc.critique.documentSection || null,
      };

      savedCritiques.push(critiqueData);
      emit("critique_generated", critiqueData);
    }

    // Step 8: Finalize
    const robustnessScore = moderationResult.robustnessScore;
    await updateSessionStatus(sessionId, "complete", robustnessScore);

    emit("robustness_score", {
      score: robustnessScore,
      explanation: moderationResult.scoreExplanation,
    });

    emit("research_log", { message: `> Analysis complete. Robustness Score: ${robustnessScore}/100`, logType: "complete" });
    emit("session_complete", {
      sessionId,
      robustnessScore,
      critiqueCount: savedCritiques.length,
      personaCount: savedPersonas.length,
    });

    return { sessionId };
  } catch (error) {
    console.error("[Orchestrator] Analysis failed:", error);
    await updateSessionStatus(sessionId, "error");
    emit("session_error", { error: error instanceof Error ? error.message : "Unknown error" });
    emit("research_log", { message: `> ERROR: Analysis failed — ${error instanceof Error ? error.message : "Unknown error"}`, logType: "error" });
    throw error;
  }
}
