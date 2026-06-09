import { NextResponse } from "next/server";
import { getLocalDataSnapshot } from "@/lib/source-data";

export async function GET() {
  const data = getLocalDataSnapshot();
  return NextResponse.json({
    generatedAt: data.generatedAt,
    findings: data.auditFindings,
    anomalies: data.anomalies
  });
}
