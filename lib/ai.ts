import "server-only";

import { getLocalDataSnapshot, money, numberCompact } from "./source-data";

export const FEDERAL_FINANCE_SYSTEM_PROMPT = `You are a federal financial management analyst. Ground every answer in the provided source context. Focus on budget formulation and execution, audit readiness, internal controls, award monitoring, anomaly triage, document intelligence, and data lineage. Be clear about whether a claim comes from local files, inferred analytics, or future integration plans.`;

export function buildGroundingContext() {
  const data = getLocalDataSnapshot();
  const rows = data.awards.reduce((sum, award) => sum + award.rows, 0);
  const obligations = data.awards.reduce((sum, award) => sum + award.totalObligation, 0);
  return [
    `Generated at: ${data.generatedAt}`,
    `Local sources: ${data.sources.length} files; parsed: ${data.sources.filter((source) => source.status === "parsed").length}; inventoried: ${data.sources.filter((source) => source.status === "inventoried").length}.`,
    `Award rows: ${numberCompact(rows)}; obligation signal: ${money(obligations)}.`,
    `Budget books: ${data.budgetBooks.map((book) => `${book.title} (${book.exhibitCount} exhibits, ${book.numericFactCount} numeric facts)`).join("; ")}.`,
    `Audit findings: ${data.auditFindings.map((finding) => `${finding.area}: ${finding.status}/${finding.risk}`).join("; ")}.`,
    `Anomaly queue: ${data.anomalies.map((anomaly) => `${anomaly.severity} ${anomaly.category} from ${anomaly.source}`).join("; ")}.`
  ].join("\n");
}

export function localAnalystResponse(profile: string, message: string) {
  const data = getLocalDataSnapshot();
  const openFindings = data.auditFindings.filter((finding) => finding.status !== "ready");
  const topAnomalies = data.anomalies.slice(0, 3).map((anomaly) => `${anomaly.title} (${anomaly.source})`);
  const nextTables = ["source_documents", "award_transactions", "budget_accounts", "budget_lines", "financial_anomalies"];
  return [
    `${profile}: based on the local snapshot, the strongest production path is to normalize parsed CSV award rows and JSON budget-book metadata first, then queue PDF/XLSX table extraction as a second pass.`,
    `The main risk signals are ${topAnomalies.join("; ") || "currently limited to extraction backlog signals"}.`,
    `Open or monitored audit areas are ${openFindings.map((finding) => `${finding.area} (${finding.risk})`).join(", ") || "none"}.`,
    `For Neon, load ${nextTables.join(", ")} with source path, fiscal year, agency, source type, and extraction timestamp on every row. User question: ${message}`
  ].join(" ");
}
