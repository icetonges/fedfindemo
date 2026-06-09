# Tech Stack Findings From SEC OSO Demo

This file summarizes the technology stack found in `C:\Users\Peter-HP\git\secosodemo` and the deployed site at `https://secosodemo.vercel.app/`, with notes for repurposing it into the Federal Financial Management Demo.

## Core Stack

- Framework: Next.js `15.3.6`
- UI runtime: React `19`
- Language: TypeScript `5`
- Routing: Next.js App Router under `app/`
- Hosting: Vercel
- Rendering/caching: static and server-rendered Next output with ISR-style revalidation
- Package manager: npm

## Frontend

- Main dashboard pattern: full-screen operational portal
- UI implementation: React components with mostly inline styles plus global CSS
- Charts: Recharts `2.15.3`
- Fonts: IBM Plex Sans and IBM Plex Mono
- Current UX patterns:
  - Sidebar navigation
  - KPI cards
  - Data tables
  - Filters and tabs
  - AI analyst chat
  - Live intelligence feed
  - Disclaimer modal
  - Dark/light display toggle
  - Mobile CSS overrides

## Backend And APIs

- API routes use Next.js route handlers:
  - `/api/health`
  - `/api/news-feed`
  - `/api/ai-chat`
- Runtime: Node.js
- Health endpoint checks AI provider keys and database configuration
- API security headers are configured in `next.config.ts`
- Cron-triggered ingestion uses a shared secret header

## Database

- Database: Neon serverless PostgreSQL
- Client: `@neondatabase/serverless`
- Existing SEC tables:
  - `sec_news`
  - `sec_obligations`
- Repurpose direction:
  - Rename and generalize tables to federal finance concepts
  - Start with local files in `sourcedata/`
  - Normalize parsed data into Neon
  - Add ingestion metadata for provenance, source URLs, fiscal year, agency, bureau, account, object class, award ID, and extraction timestamp

## AI Stack

- Anthropic SDK: `@anthropic-ai/sdk`
- Google Gemini SDK: `@google/generative-ai`
- Groq SDK: `groq-sdk`
- Architecture: chain-of-LLMs fallback router
- Existing providers:
  - Google Gemini
  - Anthropic Claude
  - Groq-hosted Llama models
- Repurpose direction:
  - Keep the provider fallback pattern
  - Replace SEC-specific system prompts with federal financial management prompts
  - Add task profiles for budget analysis, audit readiness, anomaly detection, document summarization, and data-quality triage

## Automation And Deployment

- Hosting: Vercel
- Scheduled jobs: GitHub Actions
- CI runtime: Node.js 20
- Existing workflow pattern:
  - Install dependencies
  - Check app health
  - Run TypeScript ingestion script
  - POST updates to a protected API route
- Repurpose direction:
  - Scheduled scraping for OMB, GAO, OIG, USAspending, SAM.gov, Treasury, and agency budget material
  - Scheduled parsing of local or newly downloaded PDF, JSON, XLSX, and CSV files
  - Cache revalidation after successful ingestion

## Environment Variables

Recommended variables for the new app:

```txt
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
GROQ_API_KEY=
DATABASE_URL=
CRON_SECRET=
VERCEL_TOKEN=
NEXT_PUBLIC_APP_URL=
```

## What To Keep

- Next.js, React, TypeScript, Vercel, Neon, and GitHub Actions
- Chain-of-LLMs router
- Health endpoint
- Protected ingestion endpoint
- ISR/revalidation approach
- Dashboard shell with sidebar, KPI cards, tables, charts, and AI analyst

## What To Replace

- SEC-specific data constants
- SEC-specific prompts
- SEC-specific table names
- SEC-specific navigation taxonomy
- SEC-specific disclaimer and labels
- Static seed news with federal finance intelligence categories
- Single-agency framing with a cross-agency federal financial management framing
