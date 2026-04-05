/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

/** Context form data submitted by the user */
export interface ContextFormData {
  industry: string;
  companySize: string;
  geography: string;
  stakeholderArchetypes: string[];
  additionalContext?: string;
}

/** Geography options */
export const GEOGRAPHIES = [
  "North America",
  "Latin America",
  "Western Europe",
  "Eastern Europe",
  "Middle East & Africa",
  "South Asia",
  "Southeast Asia",
  "East Asia",
  "Oceania",
  "Global / Multi-Region",
] as const;

/** Persona as returned to the frontend */
export interface PersonaData {
  id: number;
  name: string;
  role: string;
  perspective: string;
  avatarStyle: string;
}

/** Critique as returned to the frontend */
export interface CritiqueData {
  id: number;
  personaId: number;
  personaName: string;
  personaRole: string;
  title: string;
  attack: string;
  citation: string | null;
  citationUrl: string | null;
  suggestedFix: string;
  severity: "high" | "medium" | "low";
  confidenceScore: number;
  confidenceReason: string | null;
  unhingedAttack: string | null;
  documentSection: string | null;
}

/** SSE event types for the live terminal */
export type SSEEventType =
  | "research_log"
  | "persona_created"
  | "critique_generated"
  | "robustness_score"
  | "session_complete"
  | "session_error";

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
  timestamp: string;
}

/** Research log entry for the terminal */
export interface ResearchLogEntry {
  message: string;
  logType: "search" | "analyze" | "inject" | "complete" | "error";
  timestamp: string;
}

/** Session summary returned after analysis */
export interface SessionSummary {
  id: number;
  documentTitle: string;
  robustnessScore: number | null;
  status: string;
  personas: PersonaData[];
  critiques: CritiqueData[];
  createdAt: Date;
}

/** Predefined stakeholder archetypes */
export const STAKEHOLDER_ARCHETYPES = [
  { id: "cfo", label: "The Risk-Averse CFO", description: "Focused on financial viability, ROI, and downside protection" },
  { id: "competitor", label: "The Competitive Strategist", description: "Thinks about market dynamics, competitor responses, and positioning" },
  { id: "board", label: "The Skeptical Board Member", description: "Challenges governance, regulatory risk, and long-term sustainability" },
  { id: "ops", label: "The Operations Realist", description: "Questions implementation feasibility, timelines, and resource constraints" },
  { id: "customer", label: "The Customer Advocate", description: "Evaluates impact on customers, market perception, and brand" },
] as const;

/** Industry options */
export const INDUSTRIES = [
  "Technology", "Financial Services", "Healthcare", "Manufacturing",
  "Retail & Consumer", "Energy & Utilities", "Telecommunications",
  "Transportation & Logistics", "Real Estate", "Media & Entertainment",
  "Professional Services", "Government & Public Sector", "Other",
] as const;

/** Company size options */
export const COMPANY_SIZES = [
  "Startup (<50 employees)",
  "SMB (50-500 employees)",
  "Mid-Market (500-5,000 employees)",
  "Enterprise (5,000-50,000 employees)",
  "Large Enterprise (50,000+ employees)",
] as const;
