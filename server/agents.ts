/**
 * Agent Prompts & Orchestration for The War Room
 * 
 * This module contains the system prompts for each AI persona agent,
 * the moderator agent, and the unhinged mode rewriter.
 */

import { invokeLLM } from "./_core/llm";
import type { ContextFormData } from "@shared/types";

// ============================================================
// PERSONA GENERATION
// ============================================================

const PERSONA_GENERATOR_PROMPT = `You are an expert at creating realistic stakeholder personas for consulting engagements.

Given the following context about a client engagement, generate exactly 3 stakeholder personas who would be reviewing the consulting deliverable.

Each persona must be:
1. Grounded in the specific industry and company context
2. Have a clear perspective and set of concerns
3. Represent a distinct viewpoint (financial, competitive, operational, governance, etc.)

You MUST respond with valid JSON matching the schema exactly.`;

export interface GeneratedPersona {
  name: string;
  role: string;
  perspective: string;
  avatarStyle: string;
  focusAreas: string[];
}

export async function generatePersonas(
  contextData: ContextFormData,
  researchContext: string
): Promise<GeneratedPersona[]> {
  const archetypeDescriptions = contextData.stakeholderArchetypes.join(", ");

  const response = await invokeLLM({
    messages: [
      { role: "system", content: PERSONA_GENERATOR_PROMPT },
      {
        role: "user",
        content: `Industry: ${contextData.industry}
Company Size: ${contextData.companySize}
Geography: ${contextData.geography || "Global"}
Requested Stakeholder Types: ${archetypeDescriptions}
Additional Context: ${contextData.additionalContext || "None provided"}

Industry Research Context:
${researchContext}

Generate exactly 3 stakeholder personas. Each persona should have a unique perspective based on the industry context and their role. Make them feel like real people with specific concerns.`
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "personas",
        strict: true,
        schema: {
          type: "object",
          properties: {
            personas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "A realistic persona name like 'The Risk-Averse CFO'" },
                  role: { type: "string", description: "Their title, e.g. 'Chief Financial Officer'" },
                  perspective: { type: "string", description: "One sentence describing their worldview and what they care about" },
                  avatarStyle: { type: "string", enum: ["shield", "chart", "target", "scale", "users"], description: "Icon style for the persona card" },
                  focusAreas: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 specific areas this persona will scrutinize"
                  },
                },
                required: ["name", "role", "perspective", "avatarStyle", "focusAreas"],
                additionalProperties: false,
              },
            },
          },
          required: ["personas"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("No persona generation response");
  const parsed = JSON.parse(content);
  return parsed.personas;
}

// ============================================================
// CRITIQUE GENERATION (per persona)
// ============================================================

function buildCritiquePrompt(persona: GeneratedPersona): string {
  return `You are ${persona.name}, ${persona.role}.

Your perspective: ${persona.perspective}

Your focus areas: ${persona.focusAreas.join(", ")}

You are reviewing a consulting strategy document. Your job is to find GENUINE WEAKNESSES — not generic complaints. Every critique must be:

1. SPECIFIC: Reference a specific claim, number, or assumption in the document
2. EVIDENCE-BACKED: Cite real industry data, market trends, or logical inconsistencies
3. ACTIONABLE: Include a concrete suggested fix, not just "think about this more"

You are tough but fair. You don't nitpick formatting. You attack the LOGIC, the ASSUMPTIONS, and the RISKS that the document fails to address.

IMPORTANT: For citations, reference real, verifiable sources (industry reports, market data, regulatory frameworks). If you cannot find a specific source, say "Based on industry benchmarks" rather than fabricating a citation.

You MUST respond with valid JSON matching the schema exactly.`;
}

export interface GeneratedCritique {
  title: string;
  attack: string;
  citation: string;
  citationUrl: string;
  suggestedFix: string;
  severity: "high" | "medium" | "low";
  confidenceScore: number;
  confidenceReason: string;
  documentSection: string;
}

export async function generateCritiques(
  persona: GeneratedPersona,
  documentContent: string,
  researchContext: string
): Promise<GeneratedCritique[]> {
  const response = await invokeLLM({
    messages: [
      { role: "system", content: buildCritiquePrompt(persona) },
      {
        role: "user",
        content: `Here is the strategy document to review:

---
${documentContent}
---

Industry research context available to you:
${researchContext}

Generate exactly 2 critiques. Each must attack a specific weakness in the document. Be specific, cite evidence, and suggest fixes.`
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "critiques",
        strict: true,
        schema: {
          type: "object",
          properties: {
            critiques: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Short, punchy title like 'Revenue Projection Vulnerability'" },
                  attack: { type: "string", description: "2-3 sentences explaining exactly what's wrong and why it matters" },
                  citation: { type: "string", description: "The evidence source backing this critique" },
                  citationUrl: { type: "string", description: "URL to the source, or empty string if no specific URL" },
                  suggestedFix: { type: "string", description: "Concrete, actionable fix in 1-2 sentences" },
                  severity: { type: "string", enum: ["high", "medium", "low"], description: "Risk severity" },
                  confidenceScore: { type: "integer", description: "Confidence 0-100 based on evidence quality" },
                  confidenceReason: { type: "string", description: "Why this confidence level — what evidence supports it" },
                  documentSection: { type: "string", description: "Which section of the document this critique targets" },
                },
                required: ["title", "attack", "citation", "citationUrl", "suggestedFix", "severity", "confidenceScore", "confidenceReason", "documentSection"],
                additionalProperties: false,
              },
            },
          },
          required: ["critiques"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("No critique generation response");
  const parsed = JSON.parse(content);
  return parsed.critiques;
}

// ============================================================
// MODERATOR AGENT — filters and ranks critiques
// ============================================================

const MODERATOR_PROMPT = `You are the Moderator of The War Room. You receive a set of critiques from multiple stakeholder personas reviewing a consulting document.

Your job is to:
1. FILTER: Remove any critique that is generic, vague, or not backed by evidence
2. DEDUPLICATE: If multiple critiques attack the same fundamental weakness (e.g., two critiques both targeting pricing assumptions), keep ONLY the strongest one and discard the rest
3. RANK: Order the surviving critiques by impact (highest impact first)
4. SELECT TOP 3: From the surviving, deduplicated critiques, select the TOP 3 most damaging vulnerabilities. You MUST return EXACTLY 3 indices — no more, no fewer.
5. SCORE: Calculate an overall Robustness Score (0-100) for the document
   - 90-100: Document is extremely well-defended, minor issues only
   - 70-89: Solid document with some notable gaps
   - 50-69: Significant vulnerabilities that need addressing
   - 30-49: Major structural issues
   - 0-29: Document has fundamental flaws

Be ruthless in filtering. Only keep critiques that would genuinely concern a senior partner or client executive. A critique that says "consider the risks" without specifying WHICH risks gets cut.

Critical: You MUST return exactly 3 surviving critique indices. Not 2, not 4, not 6 — exactly 3.

You MUST respond with valid JSON matching the schema exactly.`;

export interface ModeratorResult {
  survivingCritiqueIndices: number[];
  robustnessScore: number;
  scoreExplanation: string;
}

export async function moderateCritiques(
  allCritiques: { personaName: string; critique: GeneratedCritique }[],
  documentContent: string
): Promise<ModeratorResult> {
  const critiquesText = allCritiques
    .map((c, i) => `[${i}] From ${c.personaName}: "${c.critique.title}" — ${c.critique.attack}`)
    .join("\n\n");

  const response = await invokeLLM({
    messages: [
      { role: "system", content: MODERATOR_PROMPT },
      {
        role: "user",
        content: `Document being reviewed (first 2000 chars):
${documentContent.slice(0, 2000)}

All critiques submitted:
${critiquesText}

Filter these critiques. Keep only the genuinely impactful ones. Calculate the robustness score.`
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "moderation_result",
        strict: true,
        schema: {
          type: "object",
          properties: {
            survivingCritiqueIndices: {
              type: "array",
              items: { type: "integer" },
              description: "Indices of critiques that survived filtering, ordered by impact"
            },
            robustnessScore: { type: "integer", description: "Overall document robustness score 0-100" },
            scoreExplanation: { type: "string", description: "Brief explanation of the score" },
          },
          required: ["survivingCritiqueIndices", "robustnessScore", "scoreExplanation"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("No moderation response");
  return JSON.parse(content);
}

// ============================================================
// UNHINGED MODE REWRITER
// ============================================================

const UNHINGED_PROMPT = `You are a brutally honest senior consulting partner who has been in the industry for 30 years. You've seen every bad deck, every lazy analysis, and every junior consultant who thinks they can get away with hand-waving.

Your job: Take a professional critique and rewrite it in the voice of an angry partner reviewing a deck at 2 AM. Be savage, be specific, be funny. Use consulting jargon. Reference the absurdity of the situation.

Rules:
- Keep the SUBSTANCE of the critique intact — same weakness, same evidence
- Change the TONE to be brutally honest, sarcastic, and darkly funny
- Use toxic consulting jargon like "pls fix", "boil the ocean", "did you even read the SOW?", "this wouldn't survive a first-year associate's review", "back to the drawing board"
- Use consulting-specific references (e.g., "Did you learn this at a case competition?", "This wouldn't survive a first-round interview")
- Keep it under 3 sentences
- Do NOT be offensive about people — attack the WORK, not the person

You MUST respond with valid JSON matching the schema exactly.`;

export async function rewriteUnhinged(
  critiques: { title: string; attack: string }[]
): Promise<string[]> {
  const response = await invokeLLM({
    messages: [
      { role: "system", content: UNHINGED_PROMPT },
      {
        role: "user",
        content: `Rewrite each of these critiques in the voice of an angry partner at 2 AM:

${critiques.map((c, i) => `[${i}] "${c.title}": ${c.attack}`).join("\n\n")}

Rewrite ALL of them. Keep the substance, change the tone to be brutally honest and darkly funny.`
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "unhinged_rewrites",
        strict: true,
        schema: {
          type: "object",
          properties: {
            rewrites: {
              type: "array",
              items: { type: "string" },
              description: "Unhinged rewrites of each critique, in order"
            },
          },
          required: ["rewrites"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("No unhinged rewrite response");
  const parsed = JSON.parse(content);
  return parsed.rewrites;
}

// ============================================================
// INDUSTRY RESEARCH GENERATOR
// ============================================================

const RESEARCH_PROMPT = `You are a senior industry research analyst. Given an industry and context, generate a comprehensive research briefing that would help stakeholder personas evaluate a consulting strategy document.

Include:
1. Current market dynamics and trends (with approximate figures)
2. Key regulatory considerations
3. Recent competitive landscape changes
4. Common pitfalls in this industry's strategic decisions
5. Relevant benchmarks (growth rates, margins, M&A multiples, etc.)

Be specific with numbers and trends. Reference real market dynamics. This research will be injected into AI personas to make their critiques more grounded and specific.`;

export async function generateResearchContext(
  contextData: ContextFormData
): Promise<string> {
  const response = await invokeLLM({
    messages: [
      { role: "system", content: RESEARCH_PROMPT },
      {
        role: "user",
        content: `Generate a research briefing for:
Industry: ${contextData.industry}
Company Size: ${contextData.companySize}
Geography: ${contextData.geography || "Global"}
Additional Context: ${contextData.additionalContext || "None"}

Focus on current (2025-2026) market dynamics, regulatory environment, and competitive landscape for the ${contextData.geography || "global"} region. Be specific with numbers and trends.`
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("No research response");
  return content;
}

// ============================================================
// BOARDROOM DEBATE SCRIPT GENERATOR
// ============================================================

const DEBATE_PROMPT_STANDARD = `You are a scriptwriter for a high-stakes boardroom debate. Three senior stakeholders are reviewing a consulting strategy document and they DISAGREE on the most critical vulnerabilities.

Write a realistic, heated boardroom debate where the stakeholders challenge each other's critiques, build on each other's points, and escalate the tension. This should feel like a real executive meeting where people are passionate about protecting the company.

Rules:
- Write exactly 8-10 turns of dialogue
- Each turn is 1-3 sentences (keep it punchy, not monologues)
- Stakeholders should REFERENCE each other's points ("Building on what Eleanor said..." or "I disagree with David here...")
- Include natural interruptions and pushback
- Escalate tension through the debate — start measured, get more pointed
- Each speaker should stay in character (CFO talks numbers, Board talks risk, Ops talks execution)
- End with a moment of reluctant agreement on the biggest vulnerability

You MUST respond with valid JSON matching the schema exactly.`;

const DEBATE_PROMPT_UNHINGED = `You are a scriptwriter for the most TOXIC boardroom meeting ever recorded. Three senior stakeholders are tearing apart a consulting strategy document and each other. This is a 2 AM emergency meeting and everyone is exhausted, angry, and done with corporate niceties.

Write a brutal, darkly funny boardroom debate where the stakeholders:
- Openly mock each other's concerns
- Use passive-aggressive consulting jargon ("With all due respect, that's the worst take I've heard since the Canada expansion")
- Interrupt each other mid-sentence
- Reference past failures and embarrassments
- Get increasingly personal while maintaining plausible deniability

Rules:
- Write exactly 8-10 turns of dialogue
- Each turn is 1-3 sentences (punchy, aggressive, no monologues)
- Use toxic consulting jargon: "pls fix", "per my last email", "let's take this offline" (said sarcastically), "boil the ocean", "circle back", "did you even read the SOW?"
- Include at least one moment where someone says something genuinely cutting
- End with a reluctant, bitter agreement
- Attack the WORK and the LOGIC, never make it about identity

You MUST respond with valid JSON matching the schema exactly.`;

export interface DebateScriptTurn {
  speaker: string;
  text: string;
  emotion: "neutral" | "assertive" | "aggressive" | "dismissive" | "frustrated" | "sarcastic";
}

export async function generateDebateScript(
  personas: { name: string; role: string; perspective: string }[],
  critiques: { personaName: string; title: string; attack: string }[],
  isUnhinged: boolean
): Promise<DebateScriptTurn[]> {
  const personaContext = personas
    .map(p => `${p.name} (${p.role}): "${p.perspective}"`)
    .join("\n");

  const critiqueContext = critiques
    .map((c, i) => `[${i + 1}] ${c.personaName}: "${c.title}" — ${c.attack}`)
    .join("\n\n");

  const response = await invokeLLM({
    messages: [
      { role: "system", content: isUnhinged ? DEBATE_PROMPT_UNHINGED : DEBATE_PROMPT_STANDARD },
      {
        role: "user",
        content: `The stakeholders in this debate:
${personaContext}

The critiques they've raised about the strategy document:
${critiqueContext}

Write the boardroom debate. Each speaker must be one of the named personas above. Make it feel real and heated.`
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "debate_script",
        strict: true,
        schema: {
          type: "object",
          properties: {
            turns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  speaker: { type: "string", description: "Full name of the persona speaking (must match exactly)" },
                  text: { type: "string", description: "What they say — 1-3 sentences, punchy and in character" },
                  emotion: {
                    type: "string",
                    enum: ["neutral", "assertive", "aggressive", "dismissive", "frustrated", "sarcastic"],
                    description: "The emotional tone of this line"
                  },
                },
                required: ["speaker", "text", "emotion"],
                additionalProperties: false,
              },
            },
          },
          required: ["turns"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("No debate script response");
  const parsed = JSON.parse(content);
  return parsed.turns;
}
