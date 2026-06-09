import { NextRequest, NextResponse } from "next/server";
import { getLocalDataSnapshot } from "@/lib/source-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function includes(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export async function GET(request: NextRequest) {
  const data = await getLocalDataSnapshot();
  const params = request.nextUrl.searchParams;
  const status = params.get("status") ?? "";
  const risk = params.get("risk") ?? "";
  const search = params.get("search") ?? "";

  const findings = data.auditFindings
    .filter((finding) => !status || finding.status === status)
    .filter((finding) => !risk || finding.risk === risk)
    .filter((finding) => !search || [finding.area, finding.finding, finding.control, finding.evidence].some((value) => includes(value, search)));

  const documents = data.auditDocuments.filter((doc) => !search || [doc.title, doc.source, ...doc.snippets].some((value) => includes(value, search)));

  return NextResponse.json({
    generatedAt: data.generatedAt,
    filters: { status, risk, search },
    totalFindings: findings.length,
    highRisk: findings.filter((finding) => finding.risk === "high").length,
    open: findings.filter((finding) => finding.status === "open").length,
    findings,
    documents
  });
}
