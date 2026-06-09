# Initial App Blueprint

## Working Name

Federal Financial Management Demo

## Mission

Build a prototype website that showcases technical solutions, including AI and ML, for improving federal financial management. The application should focus on budget, audit, and financial operations workflows and use public/local source data as the basis for realistic demonstrations.

## Two Required Product Changes

### 1. Local Data First, Neon And Live Scraping Later

The underlying data is currently saved locally in `sourcedata/`. The first build should ingest or read this local data so the prototype can work without a cloud dependency.

The next stage should move normalized records into Neon serverless PostgreSQL. After the Neon schema is in place, scheduled jobs should scrape or ingest live public data from authoritative sources and merge that data with the local baseline.

Suggested ingestion stages:

1. Read local CSV, JSON, XLSX, and PDF files from `sourcedata/`.
2. Normalize records into typed TypeScript structures.
3. Build API routes that expose budget, award, audit, and operations views.
4. Create Neon tables for normalized data.
5. Add GitHub Actions jobs for scheduled live scraping and refresh.
6. Track provenance for every record, including source path or URL, fiscal year, agency, source type, and extraction timestamp.

### 2. Showcase Technical Solutions For Federal Financial Management

The main purpose is not only to present financial data. It should demonstrate how modern technical approaches can enhance federal financial management.

The app should include prototype modules such as:

- AI budget analyst: explains budget changes, account trends, spend plans, and variance drivers
- ML anomaly detection: flags unusual obligations, award patterns, spending spikes, or potential data-quality issues
- Audit readiness assistant: maps findings, controls, evidence, corrective actions, and due dates
- FinOps cockpit: monitors spend, vendors, object classes, burn rate, and operational risk
- Document intelligence: summarizes budget books, OIG reports, GAO decisions, and financial policy documents
- Data lineage view: shows how local files, cloud records, and live scraped sources connect

## Suggested First Pages

- Dashboard: cross-domain executive view for budget, audit, and financial operations
- Budget Lab: budget formulation/execution analytics, fiscal-year comparisons, and object-class views
- Audit Readiness: findings, controls, corrective actions, evidence, and risk status
- FinOps Monitor: obligations, awards, vendors, transactions, burn rates, and anomalies
- AI Analyst: chat interface with task profiles and source-grounded responses
- Data Sources: local data inventory, cloud sync status, scraping status, and provenance
- Solution Gallery: short demonstrations of AI/ML techniques applied to federal financial management problems

## Suggested Data Model

Initial Neon tables can be generalized rather than agency-specific:

- `source_documents`
- `budget_accounts`
- `budget_lines`
- `award_transactions`
- `audit_findings`
- `control_activities`
- `financial_anomalies`
- `intelligence_items`
- `ingestion_runs`

## Suggested API Routes

- `GET /api/health`
- `GET /api/data-sources`
- `GET /api/budget-summary`
- `GET /api/audit-readiness`
- `GET /api/finops-summary`
- `GET /api/intelligence-feed`
- `POST /api/ai-chat`
- `POST /api/ingest/local`
- `POST /api/ingest/live`

## Initial Technical Approach

Use the SEC demo stack as the foundation:

- Next.js App Router for pages and API routes
- React and TypeScript for the dashboard experience
- Recharts for budget, audit, and operations visualizations
- Local file parsing first, Neon persistence second
- AI provider fallback across Gemini, Claude, and Groq
- GitHub Actions for scheduled ingestion
- Vercel for production deployment

## Immediate Build Priorities

1. Create a clean Next.js app shell for `fedfindemo`.
2. Inventory local files in `sourcedata/` and expose a data-source status page.
3. Build first dashboard cards from local data counts and metadata.
4. Add a federal financial management AI system prompt.
5. Add the health endpoint and AI chat endpoint.
6. Define Neon schema without requiring Neon for local prototype operation.
7. Add ingestion scripts for CSV and JSON first, then XLSX and PDF.
