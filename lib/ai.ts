import "server-only";

import { getLocalDataSnapshot, money, numberCompact } from "./source-data";

export const FEDERAL_FINANCE_SYSTEM_PROMPT = `You are a federal financial management analyst. Ground every answer in the provided source context. Focus on budget formulation and execution, audit readiness, internal controls, award monitoring, anomaly triage, document intelligence, and data lineage. Be clear about whether a claim comes from local files, inferred analytics, or future integration plans.`;

export async function buildGroundingContext() {
  const data = await getLocalDataSnapshot();
  const rows = data.awards.reduce((sum, award) => sum + award.rows, 0);
  const obligations = data.awards.reduce((sum, award) => sum + award.totalObligation, 0);
  return [
    `Generated at: ${data.generatedAt}`,
    `Local sources: ${data.sources.length} files; parsed: ${data.sources.filter((source) => source.status === "parsed").length}; inventoried: ${data.sources.filter((source) => source.status === "inventoried").length}.`,
    `Award rows: ${numberCompact(rows)}; obligation signal: ${money(obligations)}.`,
    `Budget lines: ${numberCompact(data.budgetLines.length)}; FY2027 request signal: ${money(data.budgetInsights.fy2027Request)}; top account: ${data.budgetInsights.byAccount[0]?.name ?? "none"}.`,
    `Award operations: top recipient ${data.awardInsights.byRecipient[0]?.name ?? "none"}; top NAICS/program ${data.awardInsights.byNaics[0]?.name ?? "none"}.`,
    `Audit documents: ${data.auditDocuments.map((doc) => `${doc.title} (${doc.themes.map((theme) => theme.name).slice(0, 3).join(", ")})`).join("; ") || "none"}.`,
    `Audit findings: ${data.auditFindings.map((finding) => `${finding.area}: ${finding.status}/${finding.risk}`).join("; ")}.`,
    `Anomaly queue: ${data.anomalies.map((anomaly) => `${anomaly.severity} ${anomaly.category} from ${anomaly.source}`).join("; ")}.`
  ].join("\n");
}

export async function localAnalystResponse(profile: string, message: string) {
  const data = await getLocalDataSnapshot();
  const openFindings = data.auditFindings.filter((finding) => finding.status !== "ready");
  const topAnomalies = data.anomalies.slice(0, 3).map((anomaly) => `${anomaly.title} (${anomaly.source})`);
  const nextTables = ["source_documents", "award_transactions", "budget_accounts", "budget_lines", "financial_anomalies"];
  return [
    `${profile}: based on the live local snapshot, the strongest production path is to normalize parsed CSV award rows and Excel budget lines first, then attach PDF audit snippets as evidence records.`,
    `The main risk signals are ${topAnomalies.join("; ") || "currently limited to extraction backlog signals"}.`,
    `Open or monitored audit areas are ${openFindings.map((finding) => `${finding.area} (${finding.risk})`).join(", ") || "none"}.`,
    `For Neon, load ${nextTables.join(", ")} with source path, fiscal year, agency, source type, and extraction timestamp on every row. User question: ${message}`
  ].join(" ");
}
