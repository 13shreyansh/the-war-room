/**
 * Pre-generated Demo Data for The War Room
 * 
 * Contains all pre-baked results for the demo flow:
 * - 3 personas with fixed names/roles
 * - 3 critiques with unhinged rewrites
 * - 10-turn standard debate with CDN audio URLs
 * - 10-turn unhinged debate with CDN audio URLs
 * - Pre-scripted terminal log entries
 * - Robustness score + explanation
 * 
 * This enables INSTANT demo playback with zero LLM/TTS calls.
 */

import type { PersonaData, CritiqueData, DebateTurn, ResearchLogEntry } from "@shared/types";

// ===== PERSONAS =====
export const DEMO_PERSONAS: PersonaData[] = [
  {
    id: 1,
    name: "Eleanor Vance",
    role: "Chief Financial Officer",
    perspective: "Every dollar spent must justify itself with hard returns — I've seen too many 'transformational' strategies destroy shareholder value through optimistic projections and undisciplined capital allocation.",
    avatarStyle: "chart",
  },
  {
    id: 2,
    name: "David Chen",
    role: "Independent Board Director",
    perspective: "After the Canada debacle, I need ironclad evidence that management isn't repeating the same pattern of overconfidence — governance failures and regulatory blind spots kill more expansions than bad strategy.",
    avatarStyle: "shield",
  },
  {
    id: 3,
    name: "Aisha Rahman",
    role: "VP of Operations, Asia-Pacific",
    perspective: "I've spent 15 years building logistics networks in this region — the gap between a PowerPoint strategy and operational reality in Southeast Asia is wider than most Western executives can imagine.",
    avatarStyle: "target",
  },
];

// ===== CRITIQUES =====
export const DEMO_CRITIQUES: CritiqueData[] = [
  {
    id: 1,
    personaId: 1,
    personaName: "Eleanor Vance",
    personaRole: "Chief Financial Officer",
    title: "Fantasy EBITDA Margins Ignore Competitive Reality",
    attack: "The model projects Year 3 EBITDA margins of 16.5-19.8%, yet GLI's own domestic margins have compressed from 14.8% to 12.3%. You're projecting HIGHER margins in a market where local competitors explicitly stated they'll undercut on every tender. The base case NPV of +$64M evaporates if margins land at 12% instead of 16.5%.",
    citation: "GLI FY2023-FY2025 earnings reports; Expert interview transcripts (Section 4.1)",
    citationUrl: "",
    suggestedFix: "Rerun the financial model with EBITDA margins capped at 12% for Years 1-2 and 14% for Year 3. Present the revised NPV to the board as the realistic base case.",
    severity: "high",
    confidenceScore: 95,
    confidenceReason: "The document's own data contradicts its projections — GLI can't achieve higher margins abroad than at home while facing aggressive local price competition.",
    unhingedAttack: "You're projecting 19.8% EBITDA in a market where the locals literally told you they'd gut you on pricing? That's not a financial model, that's a vision board. Our own margins are bleeding domestically and somehow Southeast Asia — where we have zero brand recognition, zero relationships, and zero local expertise — is going to be MORE profitable? Did the analyst who built this model also predict we'd nail the Canada expansion? Oh wait.",
    documentSection: "Section 6: Financial Model & Projections",
  },
  {
    id: 2,
    personaId: 2,
    personaName: "David Chen",
    personaRole: "Independent Board Director",
    title: "Regulatory Blind Spot Could Kill the Entire Deal",
    attack: "The risk assessment rates foreign ownership regulatory changes as 'LOW probability' despite Vietnam's Foreign Investment Law requiring sector-specific approval for logistics and Indonesia's Negative Investment List restricting foreign ownership in domestic freight to 49%. One regulatory shift could strand $140-180M in capital with no exit path.",
    citation: "Vietnam Foreign Investment Law 2020; Indonesia Presidential Regulation No. 10/2021 (Negative Investment List)",
    citationUrl: "",
    suggestedFix: "Commission an independent legal review of foreign ownership structures in both jurisdictions. Build a regulatory scenario analysis with specific trigger points and exit mechanisms into the board presentation.",
    severity: "high",
    confidenceScore: 92,
    confidenceReason: "The regulatory frameworks are publicly documented and the document's assumption of 'no material adverse changes' is dangerously naive for a $180M commitment.",
    unhingedAttack: "We're betting $180 million that two developing-nation governments won't change their foreign ownership rules? The same Indonesia that rewrites its investment list every other year? The document literally says 'no material adverse changes in foreign ownership regulations' as a KEY ASSUMPTION — that's not risk management, that's a prayer. After Canada, I thought we agreed: hope is not a strategy.",
    documentSection: "Section 8: Risk Assessment & Mitigation",
  },
  {
    id: 3,
    personaId: 3,
    personaName: "Aisha Rahman",
    personaRole: "VP of Operations, Asia-Pacific",
    title: "90-Day Integration Timeline Is Operationally Delusional",
    attack: "The plan assumes GLI Connect can be fully deployed in 90 days per acquisition, 'consistent with North American track record.' But North American integrations involved English-speaking teams on the same ERP systems. In Vietnam and Indonesia, you're dealing with different languages, different accounting standards, different labor laws, and legacy systems that may not even have APIs. The 90-day timeline has zero basis in regional reality.",
    citation: "McKinsey Global Institute: 'Cross-border M&A integration in emerging markets averages 18-24 months for technology deployment'",
    citationUrl: "",
    suggestedFix: "Extend the integration timeline to 9-12 months per acquisition with a phased rollout. Budget for local system integration partners and plan for a 6-month parallel-run period where legacy and new systems operate simultaneously.",
    severity: "high",
    confidenceScore: 90,
    confidenceReason: "Cross-border technology integration in Southeast Asia consistently takes 3-5x longer than domestic equivalents due to infrastructure, language, and regulatory differences.",
    unhingedAttack: "Ninety days. NINETY DAYS to deploy a full technology platform in Vietnam, where half the acquired fleet probably tracks deliveries on WhatsApp groups. Our North American integrations took 90 days with teams who spoke the same language, used the same ERP, and could drive to the office for troubleshooting. Now we're sending 'Tiger Teams' from Chicago to Ho Chi Minh City and expecting the same timeline? That's not confidence, that's delusion with a travel budget.",
    documentSection: "Section 7: Integration & Operating Model",
  },
];

// ===== ROBUSTNESS SCORE =====
export const DEMO_ROBUSTNESS_SCORE = 38;
export const DEMO_SCORE_EXPLANATION = "The document contains three critical vulnerabilities: unrealistic financial projections that contradict the company's own performance data, a dangerous underestimation of regulatory risk in two complex jurisdictions, and an integration timeline with no basis in cross-border M&A reality. The strategy is built on best-case assumptions while the document's own evidence supports the bear case.";

// ===== STANDARD DEBATE (with CDN audio URLs) =====
export const DEMO_STANDARD_DEBATE: DebateTurn[] = [
  {
    index: 0,
    speaker: "Eleanor Vance",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    text: "Let's cut to the core issue. This financial model is projecting 16.5% EBITDA margins in Year 3 when we can't even hold 12.3% domestically. Who signed off on these numbers?",
    emotion: "assertive",
    audioUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/demo-audio-standard-0_43f8bd23.mp3",
  },
  {
    index: 1,
    speaker: "Aisha Rahman",
    voiceId: "pFZP5JQG7iQjIQuC4Bku",
    text: "Eleanor's being generous. The margin problem is the least of it. They're planning to deploy GLI Connect in 90 days per acquisition — in markets where half the fleet management is done through WhatsApp groups and paper manifests.",
    emotion: "frustrated",
    audioUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/demo-audio-standard-1_347cc457.mp3",
  },
  {
    index: 2,
    speaker: "David Chen",
    voiceId: "JBFqnCBsd6RMkjVDRZzb",
    text: "I want to go back to something more fundamental. We're committing up to 180 million dollars in two jurisdictions where foreign ownership rules change with the political wind. Vietnam rewrote its investment law in 2020. Indonesia updates its negative list every other year.",
    emotion: "assertive",
    audioUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/demo-audio-standard-2_61148148.mp3",
  },
  {
    index: 3,
    speaker: "Eleanor Vance",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    text: "And David, that connects directly to the financial exposure. If Indonesia caps our ownership at 49%, our entire consolidation math falls apart. We can't run a rollup strategy as a minority shareholder.",
    emotion: "aggressive",
    audioUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/demo-audio-standard-3_344edb7e.mp3",
  },
  {
    index: 4,
    speaker: "Aisha Rahman",
    voiceId: "pFZP5JQG7iQjIQuC4Bku",
    text: "Can I be direct? I've spent 15 years in this region. The local operators they want to acquire — they know we're coming. Three of them told our consultants they'll slash prices the moment a Western company enters with premium pricing. A 12% premium? In this market? That's not a strategy, it's an invitation to get undercut.",
    emotion: "frustrated",
    audioUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/demo-audio-standard-4_841f1d4d.mp3",
  },
  {
    index: 5,
    speaker: "David Chen",
    voiceId: "JBFqnCBsd6RMkjVDRZzb",
    text: "Aisha, that's exactly what happened in Canada. We went in confident, the locals responded aggressively, and we ended up writing down the entire investment. I'm not approving another expansion built on the assumption that competitors will just... let us win.",
    emotion: "dismissive",
    audioUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/demo-audio-standard-5_23a582a8.mp3",
  },
  {
    index: 6,
    speaker: "Eleanor Vance",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    text: "The bear case NPV is negative 22 million, and frankly, I think the bear case IS the base case. If you stress-test the model with realistic margins and a 12-month integration timeline instead of 90 days, the numbers don't work.",
    emotion: "aggressive",
    audioUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/demo-audio-standard-6_3ae2613b.mp3",
  },
  {
    index: 7,
    speaker: "Aisha Rahman",
    voiceId: "pFZP5JQG7iQjIQuC4Bku",
    text: "And we haven't even discussed talent. The plan calls for expatriate GMs and CFOs in each country. Do you know what the turnover rate is for expat executives in Southeast Asia? It's over 40% in the first 18 months. We'll be replacing our own leadership before the integration is half done.",
    emotion: "frustrated",
    audioUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/demo-audio-standard-7_b51b0e38.mp3",
  },
  {
    index: 8,
    speaker: "David Chen",
    voiceId: "JBFqnCBsd6RMkjVDRZzb",
    text: "So where does that leave us? Because I'm hearing three independent analyses that all point to the same conclusion — this strategy has been built on best-case assumptions and the downside scenarios haven't been honestly modeled.",
    emotion: "assertive",
    audioUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/demo-audio-standard-8_7428fb9e.mp3",
  },
  {
    index: 9,
    speaker: "Eleanor Vance",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    text: "I'll say what we're all thinking. This document needs to go back to the team with a mandate to model the realistic case, not the aspirational one. If the strategy can't survive honest assumptions, the board shouldn't be anywhere near approving it.",
    emotion: "aggressive",
    audioUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/demo-audio-standard-9_69a02114.mp3",
  },
];

// ===== UNHINGED DEBATE (with CDN audio URLs) =====
export const DEMO_UNHINGED_DEBATE: DebateTurn[] = [
  {
    index: 0,
    speaker: "Eleanor Vance",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    text: "I've read a lot of fantasy fiction in my career, but this financial model might be the most creative work I've ever seen. 19.8% EBITDA margins? In Southeast Asia? Our own margins are cratering and somehow the solution is to go play in someone else's backyard?",
    emotion: "sarcastic",
    audioUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/demo-audio-unhinged-0_4f7c91c2.mp3",
  },
  {
    index: 1,
    speaker: "Aisha Rahman",
    voiceId: "pFZP5JQG7iQjIQuC4Bku",
    text: "Eleanor, you're being too kind. The 90-day integration timeline is what really got me. Ninety days to deploy enterprise software in Vietnam — where I once spent three months just getting a SIM card registered for a corporate account. But sure, let's roll out a full technology platform. No problem.",
    emotion: "sarcastic",
    audioUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/demo-audio-unhinged-1_bba169ff.mp3",
  },
  {
    index: 2,
    speaker: "David Chen",
    voiceId: "JBFqnCBsd6RMkjVDRZzb",
    text: "Can we talk about the elephant in the room? We tried this exact playbook in Canada. CANADA. A country that shares our language, our time zones, and our legal system. And we still managed to lose our shirts. Now we want to do it simultaneously in TWO countries where we don't speak the language?",
    emotion: "aggressive",
    audioUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/demo-audio-unhinged-2_759ca74a.mp3",
  },
  {
    index: 3,
    speaker: "Eleanor Vance",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    text: "David, the best part is the key assumption — and I quote — 'local competitors do not engage in sustained predatory pricing.' The competitors literally told our consultants, ON RECORD, that they would undercut us. It's in Section 4 of this very document. Did anyone actually read their own report?",
    emotion: "aggressive",
    audioUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/demo-audio-unhinged-3_a6175832.mp3",
  },
  {
    index: 4,
    speaker: "Aisha Rahman",
    voiceId: "pFZP5JQG7iQjIQuC4Bku",
    text: "Oh, it gets better. The plan is to send 'Tiger Teams' from Chicago. Tiger Teams! Eight to twelve people who've never operated in Southeast Asia, don't speak Bahasa or Vietnamese, and think 'local knowledge' means reading a Lonely Planet guide on the flight over.",
    emotion: "sarcastic",
    audioUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/demo-audio-unhinged-4_8fbef0d2.mp3",
  },
  {
    index: 5,
    speaker: "David Chen",
    voiceId: "JBFqnCBsd6RMkjVDRZzb",
    text: "Per my last email — which apparently nobody read — I specifically asked for a regulatory risk analysis on foreign ownership caps. What I got was 'LOW probability.' Indonesia literally changes its negative investment list more often than I change my golf clubs. This is not low probability. This is a certainty we're choosing to ignore.",
    emotion: "frustrated",
    audioUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/demo-audio-unhinged-5_f8210935.mp3",
  },
  {
    index: 6,
    speaker: "Eleanor Vance",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    text: "Let me put this in terms the strategy team might understand. The bear case NPV is negative 22 million. That's the scenario they modeled as unlikely. But if you plug in realistic margins — our ACTUAL margins, not the ones from their dream journal — the bear case becomes the ONLY case.",
    emotion: "aggressive",
    audioUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/demo-audio-unhinged-6_05d7931e.mp3",
  },
  {
    index: 7,
    speaker: "Aisha Rahman",
    voiceId: "pFZP5JQG7iQjIQuC4Bku",
    text: "And can we please stop pretending that 10% customer attrition is a reasonable assumption? When we acquired TransNorth in Ontario, we lost 30% of their book in six months. ONTARIO. Now imagine that in Jakarta, where business relationships are built on personal trust and a handshake, and we're replacing the local CEO with someone from the Chicago office.",
    emotion: "frustrated",
    audioUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/demo-audio-unhinged-7_d5587c65.mp3",
  },
  {
    index: 8,
    speaker: "David Chen",
    voiceId: "JBFqnCBsd6RMkjVDRZzb",
    text: "I'm going to be blunt because someone has to. This document would not survive a first-year analyst's review at any serious firm. The assumptions contradict the evidence. The timeline is fiction. And the risk assessment reads like it was written by someone who's never lost money on a deal.",
    emotion: "aggressive",
    audioUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/demo-audio-unhinged-8_bf8cc490.mp3",
  },
  {
    index: 9,
    speaker: "Eleanor Vance",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    text: "Agreed. Send it back. And this time, tell the team that 'pls fix' doesn't mean 'make the numbers bigger.' It means model what actually happens when you spend 180 million dollars in a market that's actively trying to eat you alive.",
    emotion: "sarcastic",
    audioUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/demo-audio-unhinged-9_10d6f191.mp3",
  },
];

// ===== PRE-SCRIPTED TERMINAL LOGS =====
// These play back quickly during demo mode to simulate the analysis
export const DEMO_TERMINAL_LOGS: ResearchLogEntry[] = [
  { message: '> Session initialized. Analyzing "Project Aegis: Southeast Asia Market Entry Strategy"...', logType: "analyze", timestamp: "" },
  { message: "> Researching Transportation & Logistics industry dynamics...", logType: "search", timestamp: "" },
  { message: '> Executing query: "Transportation & Logistics market size Southeast Asia 2026"', logType: "search", timestamp: "" },
  { message: '> Executing query: "Southeast Asia regulatory framework logistics foreign ownership"', logType: "search", timestamp: "" },
  { message: '> Executing query: "ASEAN freight logistics competitive landscape M&A trends 2026"', logType: "search", timestamp: "" },
  { message: "> Analyzing regulatory environment for Enterprise companies in Southeast Asia...", logType: "search", timestamp: "" },
  { message: "> Industry research complete. 4,832 chars of context generated.", logType: "complete", timestamp: "" },
  { message: "> Generating stakeholder personas based on 3 archetypes...", logType: "analyze", timestamp: "" },
  { message: '> Persona created: Eleanor Vance — "Every dollar spent must justify itself with hard returns."', logType: "inject", timestamp: "" },
  { message: '> Persona created: David Chen — "After the Canada debacle, I need ironclad evidence."', logType: "inject", timestamp: "" },
  { message: '> Persona created: Aisha Rahman — "The gap between PowerPoint and reality in Southeast Asia is wider than most imagine."', logType: "inject", timestamp: "" },
  { message: "> Initiating document review by 3 stakeholder personas...", logType: "analyze", timestamp: "" },
  { message: "> Eleanor Vance is reviewing the document...", logType: "analyze", timestamp: "" },
  { message: "> Eleanor Vance submitted 2 critiques.", logType: "complete", timestamp: "" },
  { message: "> David Chen is reviewing the document...", logType: "analyze", timestamp: "" },
  { message: "> David Chen submitted 2 critiques.", logType: "complete", timestamp: "" },
  { message: "> Aisha Rahman is reviewing the document...", logType: "analyze", timestamp: "" },
  { message: "> Aisha Rahman submitted 2 critiques.", logType: "complete", timestamp: "" },
  { message: "> Moderator filtering 6 critiques for quality and relevance...", logType: "analyze", timestamp: "" },
  { message: "> 6 critiques reviewed. Top 3 most damaging vulnerabilities selected.", logType: "complete", timestamp: "" },
  { message: "> Generating Unhinged Mode rewrites...", logType: "analyze", timestamp: "" },
  { message: "> Unhinged Mode rewrites complete.", logType: "complete", timestamp: "" },
  { message: "> Generating boardroom debate script...", logType: "analyze", timestamp: "" },
  { message: "> Debate script ready. 10 turns generated.", logType: "complete", timestamp: "" },
  { message: "> Synthesizing voices for boardroom debate...", logType: "analyze", timestamp: "" },
  { message: "> All debate audio synthesized. 10/10 turns with audio.", logType: "complete", timestamp: "" },
  { message: "> Analysis complete. Robustness Score: 38/100", logType: "complete", timestamp: "" },
];
