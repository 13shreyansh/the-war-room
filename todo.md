# The War Room — Project TODO

## Phase 0: Setup
- [x] Configure dark theme (Consulting Dark Mode — charcoal/red/green palette)
- [x] Setup database schema for sessions, personas, critiques
- [x] Configure project structure and routing

## Phase 1: Backend
- [x] Document upload and text extraction endpoint
- [x] Context form processing (industry, company size, decision-maker archetypes)
- [x] Industry research pipeline using LLM with web search context
- [x] Persona generation engine (3 archetypes: CFO, Competitor, Board Member)
- [x] Multi-agent critique generation with structured JSON output
- [x] Moderator agent for filtering and ranking critiques
- [x] Unhinged Mode rewriter agent
- [x] SSE streaming endpoint for real-time progress updates
- [x] Confidence score calculation logic

## Phase 2: Frontend
- [x] Landing page with hero section and value proposition
- [x] Document upload component with drag-and-drop
- [x] Context form (industry, company size, stakeholder archetypes)
- [x] Live Research Terminal (scrolling real-time research activity)
- [x] Persona cards with avatar, role, and perspective
- [x] Progressive disclosure critique cards (collapsed → expanded)
- [x] Risk severity badges (HIGH / MEDIUM / LOW)
- [x] Confidence score display with tooltip
- [x] Citation links (clickable, opening in new tab)
- [x] Suggested fix section within each critique card

## Phase 3: Integration & Polish
- [x] Connect frontend to backend via tRPC + SSE
- [x] End-to-end flow: upload → research → personas → critiques
- [x] Unhinged Mode toggle with visual state change
- [x] Loading states and skeleton animations
- [x] Error handling and edge case UI
- [ ] Mobile responsiveness
- [x] Demo-ready sample document pre-loaded

## Phase 4: Testing & Delivery
- [x] Vitest unit tests for backend procedures (10 tests passing)
- [x] End-to-end flow verification
- [ ] Save checkpoint and prepare for publishing

## PRD Compliance Fixes
- [x] Add Geography field to context form and shared types
- [x] Show specific search query strings in Research Terminal (e.g., `> Executing query: "..."`)
- [x] Limit Moderator to top 3 critiques (not all surviving)
- [x] Show persona avatar icons on critique card headers
- [x] Update demo document to include geography

## Bug Fixes (User Reported)
- [x] Fix overlapping dropdown menus on Analyze page (Company Size overlaps Geography)
- [x] Fix Unhinged toggle not visibly working (replaced with custom button toggle)

## Phase 3.5: Audio Boardroom Debate (NEW)
- [x] Set up ElevenLabs API key and validate (2 tests passing)
- [x] Build ElevenLabs TTS helper (server/elevenlabs.ts)
- [x] Build debate script generator LLM agent (server/agents.ts)
- [x] Wire debate generation into orchestrator pipeline (Step 6.5)
- [x] Build Boardroom Debate player UI component (client)
- [x] Persona avatar pulse/glow sync during playback
- [x] Play/pause controls with sequential turn playback
- [x] Upload debate audio clips to S3 and stream URLs via SSE
- [x] Unhinged Mode debate variant (heated, personal, consulting jargon)
- [x] End-to-end test: full pipeline with audio debate (10/10 turns with audio, sequential playback working)
- [ ] Review 5.5: Human review of debate audio quality

## Demo Experience Overhaul (User Feedback)
- [x] Pre-generate all demo content (personas, critiques, debate scripts, audio) for instant playback
- [x] Fix voice assignments: female voices for female personas, male for male
- [x] Rewrite debate script prompts for real conflict, interruptions, drama
- [x] Generate both standard AND unhinged debate scripts with audio (20 files on CDN)
- [x] Make debate auto-play immediately after personas appear (no play button needed)
- [x] Self-running demo mode: no user interaction after clicking "Try the Demo"
- [x] Unhinged Mode toggle should visibly change the debate audio/script in demo
- [x] Eliminate all dead time in demo flow — everything should feel instant (0:08 total)
- [x] Make the debate actually interesting — real fighting, not polite discussion

## Demo Cinematic Redesign (User Feedback Round 2)
- [x] Fix audio overlap bug: stop current audio before switching on Unhinged toggle (generation token pattern)
- [x] Fix audio errors when toggling mid-playback (generation token pattern)
- [ ] Add realistic pacing to terminal (15-20 seconds, not 2 seconds)
- [ ] Add narrative framing: explain what's happening and why at each phase
- [ ] Add boardroom debate intro/preface explaining context
- [ ] Make the demo self-running for full 2 minutes (no narration needed)
- [ ] Add phase transition cards between major sections
- [ ] Stagger persona reveals with weight (not all at once)
- [ ] Make the demo tell the complete story by itself
- [ ] Test full 2-minute flow end-to-end

## PRD Phase 3: Narration Audio
- [x] Generate 14 narration audio clips via ElevenLabs (Daniel voice)
- [x] Upload all clips to CDN (14/14 success)
- [x] Create demoNarration.ts with CDN URLs and timing data
- [x] Measure exact durations for each clip

## PRD Phase 4: Cinematic /demo Page
- [x] Create Demo.tsx with full cinematic experience
- [x] Scene 1: Title Card (67% stat + problem narration)
- [x] Scene 2: Solution Intro (War Room reveal)
- [x] Scene 3: Live Demo — Upload simulation
- [x] Scene 4: Live Demo — Research Terminal
- [x] Scene 5: Persona Reveal (staggered)
- [x] Scene 6: The Fight (debate audio plays)
- [x] Scene 7: Unhinged Mode auto-activation
- [x] Scene 8: Results + Close (score + CTA)
- [x] Progress bar at bottom
- [x] Skip and Exit buttons
- [x] Register /demo route in App.tsx

## PRD Phase 5: Homepage Integration
- [x] Add "Watch the Demo" button to homepage hero (Play icon, outline variant)
- [x] Two CTAs side by side: Launch War Room + Watch Demo

## PRD Phase 6-7: Full End-to-End Testing
- [x] Test every page and flow
- [x] Produce test report (phase67_test_report.md — ALL PASS)

## PRD Phase 8: Final Polish
- [x] Final checkpoint and delivery

## Bug Fixes (Post-Delivery)
- [x] Fix demo progress bar: sync to actual scene completion, not fixed 2-min estimate
- [x] Fix debate auto-scroll: removed scrollIntoView, users can scroll manually
- [x] Add GitHub repo link with GitHub icon to homepage nav (https://github.com/13shreyansh/the-war-room)

## SEO Fixes (Homepage)
- [x] Add meta keywords tag (10 keywords)
- [x] Add H2 heading to homepage ("How It Works")
- [x] Fix page title (41 characters: "The War Room \u2014 AI Strategy Stress Testing")
- [x] Add meta description (159 characters)
