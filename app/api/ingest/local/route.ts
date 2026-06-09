import { NextRequest, NextResponse } from "next/server";
import { getLocalDataSnapshot } from "@/lib/source-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("x-cron-secret") === secret;
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await getLocalDataSnapshot();
  return NextResponse.json({
    ok: true,
    mode: "local",
    generatedAt: data.generatedAt,
    loaded: {
      sources: data.sources.length,
      awards: data.awardInsights.totalRows,
      budgetLines: data.budgetLines.length,
      auditDocuments: data.auditDocuments.length,
      budgetBooks: data.budgetBooks.length,
      anomalies: data.anomalies.length
    }
  });
}
