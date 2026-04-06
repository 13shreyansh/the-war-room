<div align="center">

# 🛡️ The War Room

### AI-Powered Strategy Stress Testing

**Your strategy won't survive first contact with the client.**

Upload your consulting deliverable. AI-generated stakeholder personas — armed with live industry research — will find every weakness before your client does.

[![Live Demo](https://img.shields.io/badge/Live_Demo-thewarroom.manus.space-FF4C4C?style=for-the-badge&logo=googlechrome&logoColor=white)](https://thewarroom.manus.space)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)

[Live Demo](https://thewarroom.manus.space) · [Watch the Cinematic Demo](https://thewarroom.manus.space/demo) · [Report Bug](https://github.com/13shreyansh/the-war-room/issues)

</div>

---

<div align="center">

![The War Room — Results Page](https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/results_7d472ecd.webp)

*AI personas debate your strategy in a live boardroom simulation with synthesized voices.*

</div>

---

## The Problem

**67% of consulting deliverables fail to survive first contact with the client.** Strategies get torn apart in boardrooms by stakeholders the consulting team never anticipated. The CFO questions the financial model. The board member raises regulatory concerns. The operations lead calls the timeline fantasy.

Traditional review processes rely on internal team feedback — people who share the same assumptions and blind spots. By the time the client's stakeholders see the work, it's too late to fix fundamental flaws.

## The Solution

The War Room simulates the boardroom before you enter it. Upload any strategy document and the system will:

1. **Research the industry** — live web queries build real market context, not generic assumptions
2. **Generate stakeholder personas** — each grounded in the specific industry, geography, and company context you provide
3. **Attack the document** — personas independently identify vulnerabilities with citations and evidence
4. **Stage a boardroom debate** — AI-synthesized voices argue over the most critical flaws in a 10-turn debate
5. **Score the strategy** — a Robustness Score (0–100) tells you exactly how exposed you are

Toggle **Unhinged Mode** to hear the critiques delivered the way an angry partner would at 2 AM — because sometimes you need the truth delivered raw.

## Features

| Feature | Description |
|---------|-------------|
| **Research-Backed Personas** | AI generates stakeholder personas grounded in real industry data from live web research — not generic ChatGPT roleplay |
| **Evidence-Based Critiques** | Every critique comes with citations, confidence scores, and suggested fixes. No vague "consider the risks" feedback |
| **Audio Boardroom Debate** | 10-turn voiced debate between personas using ElevenLabs text-to-speech with distinct voices per character |
| **Unhinged Mode** | Toggle to hear critiques rewritten in the voice of an angry consulting partner — brutal, personal, and uncomfortably accurate |
| **Live Research Terminal** | Watch the AI research your industry in real-time with animated terminal output showing actual search queries |
| **Robustness Score** | A 0–100 score with detailed breakdown explaining exactly where and why your strategy is vulnerable |
| **Cinematic Demo** | A self-running 2-minute narrated walkthrough at `/demo` with synced audio, scene transitions, and auto-advancing timeline |

## Architecture

The War Room uses a multi-agent orchestration pipeline that processes documents through several specialized AI agents:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React 19)                        │
│  Upload → Context Form → SSE Stream → Results + Debate Player   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ tRPC + SSE
┌──────────────────────────────▼──────────────────────────────────┐
│                     SERVER (Express + tRPC)                      │
│                                                                  │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Industry │→ │  Persona  │→ │ Critique │→ │   Moderator   │  │
│  │ Research │  │ Generator │  │  Agents  │  │ (Top 3 Filter)│  │
│  │  Agent   │  │  (×3)     │  │  (×3)    │  │               │  │
│  └──────────┘  └───────────┘  └──────────┘  └───────┬───────┘  │
│                                                      │          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────▼────────┐ │
│  │   Unhinged   │  │   Debate     │  │    Score Calculator   │ │
│  │   Rewriter   │  │  Script Gen  │  │   (Weighted Average)  │ │
│  └──────────────┘  └──────┬───────┘  └───────────────────────┘ │
│                           │                                     │
│                  ┌────────▼────────┐                            │
│                  │   ElevenLabs    │                            │
│                  │  Voice Synth    │                            │
│                  │  (10 turns ×2)  │                            │
│                  └─────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

Each agent streams progress updates via Server-Sent Events (SSE), so the user sees every step happening in real-time through the Research Terminal.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Tailwind CSS 4, Vite |
| **Backend** | Express 4, tRPC 11, Node.js |
| **Database** | TiDB (MySQL-compatible) via Drizzle ORM |
| **AI/LLM** | Multi-agent orchestration with structured JSON output |
| **Voice** | ElevenLabs Text-to-Speech (6 distinct voices) |
| **Auth** | Manus OAuth with session cookies |
| **Storage** | S3-compatible object storage for audio files |
| **Hosting** | Manus Platform with custom domain |

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/13shreyansh/the-war-room.git
cd the-war-room

# Install dependencies
pnpm install

# Set up environment variables (see .env.example)
cp .env.example .env

# Run database migrations
pnpm drizzle-kit generate
pnpm drizzle-kit push

# Start the development server
pnpm dev
```

### Environment Variables

The following environment variables are required:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MySQL/TiDB connection string |
| `JWT_SECRET` | Session cookie signing secret |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for voice synthesis |
| `BUILT_IN_FORGE_API_KEY` | LLM API key for AI agents |
| `BUILT_IN_FORGE_API_URL` | LLM API endpoint |

## Usage

### Standard Flow

1. **Upload** — Paste or upload your strategy document (`.txt` or `.md`)
2. **Set Context** — Choose industry, company size, geography, and up to 3 stakeholder archetypes
3. **Enter The War Room** — Watch the AI research, generate personas, and attack your document in real-time
4. **Review Results** — Read critiques, listen to the boardroom debate, and check your Robustness Score
5. **Toggle Unhinged** — Switch to Unhinged Mode for the brutally honest version

### Cinematic Demo

Visit [`/demo`](https://thewarroom.manus.space/demo) for a self-running 2-minute narrated walkthrough that showcases the full pipeline with pre-generated content and professional narration.

## Project Structure

```
the-war-room/
├── client/                  # React frontend
│   ├── src/
│   │   ├── pages/           # Home, Analyze, Results, Demo
│   │   ├── components/      # DebatePlayer, UI components
│   │   └── lib/             # tRPC client, demo data, narration
├── server/                  # Express + tRPC backend
│   ├── routers.ts           # tRPC procedures
│   ├── agents.ts            # AI agent definitions
│   ├── elevenlabs.ts        # Voice synthesis helper
│   ├── db.ts                # Database queries
│   └── _core/               # Framework plumbing (auth, LLM, etc.)
├── drizzle/                 # Database schema & migrations
├── shared/                  # Shared types between client/server
└── storage/                 # S3 file storage helpers
```

## Screenshots

<div align="center">

### Homepage
![Homepage](https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/homepage_9ad49a20.webp)

### War Room Results
![Results](https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/results_7d472ecd.webp)

### Cinematic Demo
![Demo](https://d2xsxph8kpxj0f.cloudfront.net/310519663394062026/DP3EtwNNqFZjAnMmMTxdD8/demo_d5f9a297.webp)

</div>

## Hackathon Context

The War Room was built for the **Manus x Vibecoding Consulting AI Hackathon**. The challenge: build an AI tool that transforms how consultants prepare and deliver their work.

Our thesis: the biggest risk in consulting isn't bad analysis — it's untested assumptions. The War Room doesn't write your strategy. It makes sure your strategy survives.

## Contributing

Contributions are welcome. If you have a suggestion that would make this better, please fork the repo and create a pull request, or open an issue with the tag "enhancement."

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the Apache License 2.0. See [`LICENSE`](LICENSE) for more information.

## Acknowledgments

- [Manus](https://manus.im) — Platform, hosting, OAuth, and AI infrastructure
- [ElevenLabs](https://elevenlabs.io) — Text-to-speech voice synthesis
- [shadcn/ui](https://ui.shadcn.com) — UI component library
- [tRPC](https://trpc.io) — End-to-end typesafe APIs
- [Drizzle ORM](https://orm.drizzle.team) — TypeScript ORM for database access

---

<div align="center">

**The War Room doesn't write your strategy — it makes sure your strategy survives.**

[![Live Demo](https://img.shields.io/badge/Try_It_Now-thewarroom.manus.space-FF4C4C?style=for-the-badge)](https://thewarroom.manus.space)

</div>
