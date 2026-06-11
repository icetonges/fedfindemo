import { NextRequest, NextResponse } from "next/server";
import { persistModelRun } from "@/lib/neon";
import { runSolutionAnalysis } from "@/lib/solutions";
import { getLocalDataSnapshot } from "@/lib/source-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type EnrichedSolutionAnalysis = Awaited<ReturnType<typeof runSolutionAnalysis>> & {
  corpusProfile: unknown;
  executiveSummary: string;
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const selectedSources = Array.isArray(body.selectedSources) ? body.selectedSources.map(String) : [];
  const analysis = await runSolutionAnalysis({
    solutionId: String(body.solutionId ?? ""),
    selectedSources,
    modelId: String(body.modelId ?? ""),
    target: String(body.target ?? "").slice(0, 120),
    horizon: String(body.horizon ?? "Current snapshot").slice(0, 120)
  });
  const enriched = analysis as EnrichedSolutionAnalysis;
  const snapshot = await getLocalDataSnapshot();
  const persistence = await persistModelRun({
    solutionId: enriched.solution.id,
    modelId: enriched.model.id,
    target: enriched.target,
    horizon: enriched.horizon,
    sourceSignature: snapshot.sourceSignature,
    selectedSources,
    corpusProfile: enriched.corpusProfile,
    executiveSummary: enriched.executiveSummary,
    modelOutput: enriched
  }).catch((error) => ({ persisted: false, reason: error instanceof Error ? error.message : "Persistence failed." }));

  return NextResponse.json({ ...enriched, persistence });
}
