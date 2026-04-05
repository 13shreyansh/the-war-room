/**
 * Demo Narration Audio — CDN URLs and timing data.
 * Generated via ElevenLabs (Daniel voice — British male narrator).
 * Each segment has a CDN URL and measured duration in milliseconds.
 */

export interface NarrationSegment {
  id: string;
  url: string;
  durationMs: number;
  text: string;
}

export const NARRATION_SEGMENTS: NarrationSegment[] = [
  {
    id: "narr_01_problem",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/narr_01_problem_f17ea94d.mp3",
    durationMs: 20193,
    text: "Sixty-seven percent. That's how many corporate strategies fail — not because the ideas are bad, but because nobody in the room had the guts to say what was actually wrong. Teams spend months building the perfect deck. Then one skeptical question in the boardroom... and the whole thing falls apart.",
  },
  {
    id: "narr_02_hook",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/narr_02_hook_a7df8c46.mp3",
    durationMs: 3657,
    text: "What if you could hear those questions... before they're real?",
  },
  {
    id: "narr_03_solution",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/narr_03_solution_ba35967e.mp3",
    durationMs: 19958,
    text: "This is The War Room. You upload a strategy document. Our AI reads every line, researches your market, and generates adversarial stakeholders — a skeptical CFO, a hostile board member, a cynical operations head. Each one is designed to find the weakest point in your plan.",
  },
  {
    id: "narr_04_twist",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/narr_04_twist_5ebc3202.mp3",
    durationMs: 4545,
    text: "And then... they debate. Out loud. And you listen.",
  },
  {
    id: "narr_05_demo_intro",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/narr_05_demo_intro_1818f7a9.mp3",
    durationMs: 12251,
    text: "Let's put it to the test. Here's a real strategy — a forty-seven million dollar market entry plan for Southeast Asia. A logistics company betting everything on this expansion.",
  },
  {
    id: "narr_06_research",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/narr_06_research_6f2da1d9.mp3",
    durationMs: 15726,
    text: "The War Room goes to work. It researches your industry, your competitors, the regulatory landscape — every query tailored to your specific context. This isn't a template. This is custom intelligence.",
  },
  {
    id: "narr_07_persona1",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/narr_07_persona1_4a031146.mp3",
    durationMs: 8020,
    text: "Three stakeholders generated. Eleanor Vance — CFO. She's already found a hole in the pricing model.",
  },
  {
    id: "narr_08_persona2",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/narr_08_persona2_2d17be78.mp3",
    durationMs: 6113,
    text: "David Chen — Board Member. He's seen this exact play fail in another market.",
  },
  {
    id: "narr_09_persona3",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/narr_09_persona3_ccae9b43.mp3",
    durationMs: 6296,
    text: "Aisha Rahman — Operations. She knows what the ground reality actually looks like.",
  },
  {
    id: "narr_10_fight",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/narr_10_fight_d177a211.mp3",
    durationMs: 1802,
    text: "Now... they fight.",
  },
  {
    id: "narr_11_unhinged",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/narr_11_unhinged_109f146e.mp3",
    durationMs: 4180,
    text: "And if you want the version nobody says out loud...",
  },
  {
    id: "narr_12_results",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/narr_12_results_b2324ffe.mp3",
    durationMs: 19670,
    text: "Robustness Score: thirty-eight out of a hundred. Three critical vulnerabilities identified — pricing assumptions that don't survive contact with reality, regulatory risks buried in a footnote, and an integration timeline that ignores everything we know about Southeast Asian markets.",
  },
  {
    id: "narr_13_close",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/narr_13_close_44501293.mp3",
    durationMs: 6217,
    text: "Every strategy has blind spots. The War Room finds them — before the boardroom does.",
  },
  {
    id: "narr_14_tagline",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/narr_14_tagline_53290cdc.mp3",
    durationMs: 2456,
    text: "The War Room. Built with Manus.",
  },
];

/** Total narration audio time in milliseconds */
export const TOTAL_NARRATION_MS = NARRATION_SEGMENTS.reduce(
  (sum, s) => sum + s.durationMs,
  0
);

/** Get a narration segment by ID */
export function getNarrationSegment(id: string): NarrationSegment | undefined {
  return NARRATION_SEGMENTS.find((s) => s.id === id);
}
