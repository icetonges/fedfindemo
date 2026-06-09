import "server-only";

import { getLocalDataSnapshot, money, numberCompact } from "./source-data";

type InsightRow = Record<string, string | number>;

export type InsightPayload = {
  id: string;
  title: string;
  eyebrow: string;
  summary: string;
  metrics: Array<{ label: string; value: string; detail: string }>;
  rows: InsightRow[];
  sources: string[];
};

export async function getInsightPayload(id: string): Promise<InsightPayload> {
  const data = await getLocalDataSnapshot();
  const parsedSources = data.sources.filter((source) => source.status === "parsed");

  if (id === "sources") {
    return {
      id,
      eyebrow: "Source Lineage",
      title: "Live source files and parser coverage",
      summary: "Every row in the application traces back to the local source inventory. This view shows the files currently powering the runtime snapshot.",
      metrics: [
        { label: "Total files", value: numberCompact(data.sources.length), detail: "Complete sourcedata inventory." },
        { label: "Parsed files", value: numberCompact(parsedSources.length), detail: "Files feeding typed budget, award, and audit outputs." },
        { label: "Source signature", value: data.sourceSignature.slice(0, 12), detail: "Changes when file path, size, or modified time changes." }
      ],
      rows: data.sources.slice(0, 80).map((source) => ({
        Source: source.relativePath,
        Type: source.extension.toUpperCase(),
        Domain: source.domain,
        FY: source.fiscalYear,
        Status: source.status,
        Modified: new Date(source.lastModified).toLocaleString()
      })),
      sources: data.sources.map((source) => source.relativePath).slice(0, 12)
    };
  }

  if (id === "awards") {
    return {
      id,
      eyebrow: "Financial Operations",
      title: "Award rows, obligations, counterparties, and data quality",
      summary: "USAspending prime and subaward extracts are normalized into recipient, agency, NAICS, state, object-class, and action-month views.",
      metrics: [
        { label: "Award rows", value: numberCompact(data.awardInsights.totalRows), detail: "Parsed CSV rows." },
        { label: "Obligation signal", value: money(data.awardInsights.totalObligations), detail: "Federal action and award amount fields." },
        { label: "Negative actions", value: numberCompact(data.awardInsights.negativeObligations), detail: "Potential deobligations or corrections." }
      ],
      rows: data.awardTransactions.slice(0, 80).map((award) => ({
        Award: award.awardId,
        Recipient: award.recipient,
        Agency: award.subAgency || award.agency,
        FY: award.fiscalYear,
        Obligation: money(award.obligation),
        Program: award.naics,
        State: award.state
      })),
      sources: data.awards.map((award) => award.file)
    };
  }

  if (id === "budget") {
    return {
      id,
      eyebrow: "Budget Intelligence",
      title: "Budget request, account variance, and program-line evidence",
      summary: "DoD spreadsheet exhibits are parsed into account, program, fiscal-year, scenario, and appropriation-family observations.",
      metrics: [
        { label: "Budget observations", value: numberCompact(data.budgetInsights.totalLineObservations), detail: "Parsed exhibit rows." },
        { label: "FY2027 request", value: money(data.budgetInsights.fy2027Request), detail: "DoD Excel exhibit request signal." },
        { label: "Largest variance", value: money(data.budgetInsights.yearOverYear[0]?.delta ?? 0), detail: data.budgetInsights.yearOverYear[0]?.accountTitle ?? "No variance found." }
      ],
      rows: data.budgetInsights.largestLines.slice(0, 80).map((line) => ({
        Program: line.programTitle,
        Account: line.accountTitle,
        FY: line.fiscalYear,
        Scenario: line.scenario,
        Amount: money(line.amount),
        Source: line.source
      })),
      sources: [...new Set(data.budgetLines.map((line) => line.source))].slice(0, 18)
    };
  }

  if (id === "audit") {
    return {
      id,
      eyebrow: "Audit Readiness",
      title: "Findings, controls, evidence, and document themes",
      summary: "Audit PDFs are scanned for control and finding themes, then translated into a readiness register.",
      metrics: [
        { label: "Open findings", value: numberCompact(data.auditFindings.filter((finding) => finding.status === "open").length), detail: "Corrective-action candidates." },
        { label: "Audit documents", value: numberCompact(data.auditDocuments.length), detail: "Parsed audit evidence sources." },
        { label: "High risk", value: numberCompact(data.auditFindings.filter((finding) => finding.risk === "high").length), detail: "High-risk finding records." }
      ],
      rows: data.auditFindings.map((finding) => ({
        Area: finding.area,
        Status: finding.status,
        Risk: finding.risk,
        Finding: finding.finding,
        Control: finding.control,
        Evidence: finding.evidence
      })),
      sources: data.auditDocuments.map((doc) => doc.source)
    };
  }

  return {
    id,
    eyebrow: "Insight",
    title: "Insight not found",
    summary: "Choose one of the dashboard KPI drilldowns.",
    metrics: [],
    rows: [],
    sources: []
  };
}
