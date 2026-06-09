import { NextRequest, NextResponse } from "next/server";
import { runSolutionAnalysis } from "@/lib/solutions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const selectedSources = Array.isArray(body.selectedSources) ? body.selectedSources.map(String) : [];
  return NextResponse.json(await runSolutionAnalysis({
    solutionId: String(body.solutionId ?? ""),
    selectedSources,
    modelId: String(body.modelId ?? ""),
    target: String(body.target ?? "").slice(0, 120),
    horizon: String(body.horizon ?? "Current snapshot").slice(0, 120)
  }));
}
