import { NextResponse } from "next/server";
import { getLocalDataSnapshot } from "@/lib/source-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function percent(value: number, total: number) {
  return total ? (value / total) * 100 : 0;
}

export async function GET() {
  const data = await getLocalDataSnapshot();
  const highRiskFindings = data.auditFindings.filter((finding) => finding.risk === "high");
  const openFindings = data.auditFindings.filter((finding) => finding.status === "open");
  const topRecipient = data.awardInsights.byRecipient[0];
  const topFamily = data.budgetInsights.byAppropriationFamily[0];
  const parsedSources = data.sources.filter((source) => source.status === "parsed").length;
  const latestModified = data.sources
    .map((source) => new Date(source.lastModified).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0];

  return NextResponse.json({
    generatedAt: data.generatedAt,
    posture: {
      readinessScore: Math.max(0, Math.round(100 - highRiskFindings.length * 12 - openFindings.length * 7)),
      sourceCoverage: percent(parsedSources, data.sources.length),
      topVendorShare: percent(topRecipient?.value ?? 0, data.awardInsights.totalObligations),
      fy2027Request: data.budgetInsights.fy2027Request,
      latestSourceChange: latestModified ? new Date(latestModified).toISOString() : data.generatedAt
    },
    kpis: [
      { label: "Budget observations", value: data.budgetInsights.totalLineObservations, tone: "budget" },
      { label: "Award rows", value: data.awardInsights.totalRows, tone: "finops" },
      { label: "Open audit findings", value: openFindings.length, tone: "audit" },
      { label: "Parsed sources", value: parsedSources, tone: "source" }
    ],
    budget: {
      topFamily,
      largestLines: data.budgetInsights.largestLines.slice(0, 8),
      yearOverYear: data.budgetInsights.yearOverYear.slice(0, 8)
    },
    audit: {
      findings: data.auditFindings,
      documents: data.auditDocuments.map((doc) => ({
        id: doc.id,
        title: doc.title,
        source: doc.source,
        status: doc.status,
        pages: doc.pages,
        themes: doc.themes.slice(0, 6)
      }))
    },
    finops: {
      topRecipient,
      topRecipients: data.awardInsights.byRecipient.slice(0, 8),
      negativeObligations: data.awardInsights.negativeObligations,
      anomalies: data.anomalies
    },
    queue: [
      ...data.anomalies.slice(0, 4).map((item) => ({
        id: item.id,
        lane: "FinOps",
        priority: item.severity,
        title: item.title,
        detail: item.detail,
        source: item.source
      })),
      ...openFindings.slice(0, 4).map((item) => ({
        id: item.id,
        lane: "Audit",
        priority: item.risk,
        title: item.area,
        detail: item.finding,
        source: item.evidence
      }))
    ]
  });
}
