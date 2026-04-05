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
