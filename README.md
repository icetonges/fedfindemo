# Federal Financial Management Demo

Federal Financial Management Demo is a prototype platform for showcasing technical solutions that can improve federal budget, audit, and financial operations workflows.

The app will repurpose the proven stack from the SEC OSO demo while shifting the mission from one agency-specific dashboard to a broader federal financial management showcase. The first version should use locally saved source data from `sourcedata/`, then graduate the normalized data into Neon PostgreSQL and add scheduled live scraping from authoritative public sources.

## Product Direction

The website should demonstrate how AI, ML, automation, and modern web architecture can enhance federal financial management across:

- Budget formulation, execution, obligation tracking, and variance analysis
- Audit readiness, findings management, evidence tracking, and internal controls
- Financial operations, procurement, grants, vendor activity, and payment-risk monitoring
- Public-data intelligence from sources such as USAspending, agency budget books, OIG reports, GAO, OMB, Treasury, SAM.gov, and agency releases

## Starting Data

Local source data is already saved under:

- `sourcedata/sAMPLE DATA 1 USASPENDING/` for USAspending CSV extracts
- `sourcedata/dod-json/` for structured DoD budget JSON
- `sourcedata/dod-pdf/` for DoD budget PDFs
- `sourcedata/dod-1/` for DoD spreadsheet exhibits

The initial app should treat these files as the offline source of truth. Later, the data pipeline should parse and normalize them into Neon, then supplement them with scheduled scraping and ingestion.

## Recommended Stack

- Next.js 15 with the App Router
- React 19
- TypeScript
- Recharts for charts and dashboards
- Neon serverless PostgreSQL for cloud data storage
- Next.js API routes for data, health checks, AI chat, and ingestion endpoints
- Gemini, Claude, and Groq/Llama SDKs for chain-of-LLMs fallback
- GitHub Actions for scheduled data refresh jobs
- Vercel for hosting, ISR, and production deployment

See `TECH_STACK_FINDINGS.md` for the stack inventory from the SEC demo and `INITIAL_APP_BLUEPRINT.md` for the first build plan.
