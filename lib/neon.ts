import "server-only";

import { neon } from "@neondatabase/serverless";

export async function persistModelRun(payload: {
  solutionId: string;
  modelId: string;
  target: string;
  horizon: string;
  sourceSignature: string;
  selectedSources: string[];
  corpusProfile: unknown;
  executiveSummary: string;
  modelOutput: unknown;
}) {
  if (!process.env.DATABASE_URL) return { persisted: false, reason: "DATABASE_URL is not configured." };

  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`
    insert into model_runs (
      solution_id,
      model_id,
      target,
      horizon,
      source_signature,
      selected_sources,
      corpus_profile,
      executive_summary,
      model_output
    )
    values (
      ${payload.solutionId},
      ${payload.modelId},
      ${payload.target},
      ${payload.horizon},
      ${payload.sourceSignature},
      ${payload.selectedSources},
      ${JSON.stringify(payload.corpusProfile)}::jsonb,
      ${payload.executiveSummary},
      ${JSON.stringify(payload.modelOutput)}::jsonb
    )
    returning id
  `;

  return { persisted: true, id: rows[0]?.id };
}
