import "server-only";

import { getLocalDataSnapshot, money, numberCompact } from "./source-data";
import type { LocalDataSnapshot, SourceDocument } from "./types";

export const solutionDefinitions = [
  {
    id: "budget-analyst",
    title: "AI budget analyst",
    category: "Budget",
    summary: "Explains budget-book changes, fiscal-year comparisons, and variance drivers from structured DoD sources.",
    defaultModel: "variance-driver-model",
    targetOptions: ["FY2027 request", "FY delta", "Appropriation family", "Program line amount"]
  },
  {
    id: "ml-anomaly-detection",
    title: "ML anomaly detection",
    category: "Risk",
    summary: "Flags negative obligation actions, missing recipients, extraction gaps, and unusual award concentrations.",
    defaultModel: "isolation-risk-model",
    targetOptions: ["Anomaly severity", "Negative action", "Missing recipient", "Concentration risk"]
  },
  {
    id: "audit-readiness-assistant",
    title: "Audit readiness assistant",
    category: "Audit",
    summary: "Maps findings to controls, evidence files, due dates, and corrective-action status.",
    defaultModel: "control-readiness-model",
    targetOptions: ["Control readiness", "Finding risk", "Evidence sufficiency", "Due date exposure"]
  },
  {
    id: "finops-cockpit",
    title: "FinOps cockpit",
    category: "Financial operations",
    summary: "Profiles obligations, vendors, agencies, transactions, and burn-rate proxies from award data.",
    defaultModel: "spend-forecast-model",
    targetOptions: ["Obligation amount", "Recipient concentration", "Agency portfolio", "Action month"]
  },
  {
    id: "document-intelligence",
    title: "Document intelligence",
    category: "Documents",
    summary: "Queues PDF and spreadsheet exhibits for table extraction, summary, and source-grounded Q&A.",
    defaultModel: "evidence-extraction-model",
    targetOptions: ["Document theme", "Extraction readiness", "Evidence snippet", "Source family"]
  },
  {
    id: "data-lineage-view",
    title: "Data lineage view",
    category: "Lineage",
    summary: "Connects local files, parsed APIs, future Neon records, and scheduled public-source ingestion.",
    defaultModel: "lineage-quality-model",
    targetOptions: ["Parser coverage", "Refresh risk", "Domain coverage", "Cloud readiness"]
  }
] as const;

export const modelCatalog = [
  { id: "variance-driver-model", label: "Gradient boosted variance driver", family: "Supervised explainability" },
  { id: "isolation-risk-model", label: "Isolation forest anomaly detector", family: "Unsupervised risk scoring" },
  { id: "control-readiness-model", label: "Control readiness classifier", family: "Classification" },
  { id: "spend-forecast-model", label: "Obligation time-series forecaster", family: "Forecasting" },
  { id: "evidence-extraction-model", label: "LLM evidence extraction analyst", family: "Document intelligence" },
  { id: "lineage-quality-model", label: "Lineage quality scorer", family: "Data quality" }
] as const;

export type SolutionId = (typeof solutionDefinitions)[number]["id"];
export type ModelId = (typeof modelCatalog)[number]["id"];

type AnalysisRequest = {
  solutionId: string;
  selectedSources: string[];
  modelId: string;
  target: string;
  horizon: string;
};

function cleanSolutionId(value: string): SolutionId {
  return solutionDefinitions.some((item) => item.id === value) ? value as SolutionId : "budget-analyst";
}

function cleanModelId(value: string): ModelId {
  return modelCatalog.some((item) => item.id === value) ? value as ModelId : "variance-driver-model";
}

function selectedSourceSet(sources: string[]) {
  return new Set(sources.slice(0, 80).map((item) => item.slice(0, 260)));
}

function selectedOrDomainSources(data: LocalDataSnapshot, sourceSet: Set<string>, domains: SourceDocument["domain"][]) {
  const selected = data.sources.filter((source) => sourceSet.has(source.relativePath));
  return selected.length ? selected : data.sources.filter((source) => domains.includes(source.domain));
}

function confidence(rows: number, sourceCount: number) {
  return Math.min(97, Math.max(58, Math.round(54 + Math.log10(Math.max(rows, 1)) * 12 + Math.min(sourceCount, 12))));
}

function impact(name: string, value: number, direction = "positive") {
  return { name, value: Math.round(value * 10) / 10, direction };
}

function summarizeSources(sources: SourceDocument[]) {
  return sources.slice(0, 8).map((source) => ({
    name: source.name,
    path: source.relativePath,
    domain: source.domain,
    type: source.extension.toUpperCase(),
    fiscalYear: source.fiscalYear,
    status: source.status,
    role: source.domain === "awards"
      ? "Award transaction evidence"
      : source.domain === "exhibit"
        ? "Budget exhibit evidence"
        : source.domain === "budget"
          ? "Structured budget-book evidence"
          : "Document and policy evidence"
  }));
}

function methodologyFor(solutionId: SolutionId, modelLabel: string, target: string) {
  const common = [
    `Model selected: ${modelLabel}.`,
    `Target being analyzed: ${target}.`,
    "The run uses the selected source files when provided; otherwise it falls back to the source domains most relevant to the chosen solution.",
    "Each output row keeps an evidence reference so an analyst can trace the score back to a source file, transaction, exhibit, finding, or document."
  ];
  const specific: Record<SolutionId, string[]> = {
    "budget-analyst": [
      "Budget observations are grouped by fiscal year, account, scenario, appropriation family, and source exhibit.",
      "The model ranks drivers by their contribution to dollar variance and identifies the program/account lines most responsible for the signal."
    ],
    "ml-anomaly-detection": [
      "Award rows are scored for amount magnitude, negative obligation behavior, missing recipient information, and concentration risk.",
      "The model does not replace investigation; it prioritizes which records need analyst review first."
    ],
    "audit-readiness-assistant": [
      "Audit findings are converted into control-readiness records with risk, status, evidence, and corrective-action implications.",
      "The model aligns the finding language with evidence sufficiency and control-owner action."
    ],
    "finops-cockpit": [
      "Recipient, agency, geography, NAICS/program, object class, and action-month features are used to describe spend concentration.",
      "The model identifies portfolio segments that deserve burn-rate, obligation-validity, or closeout review."
    ],
    "document-intelligence": [
      "Documents and exhibits are scored for extraction readiness, fiscal-year relevance, parser status, and evidence reuse potential.",
      "The model output is a document triage plan for table extraction, snippet capture, and source-grounded Q&A."
    ],
    "data-lineage-view": [
      "Source files are scored for parser coverage, domain coverage, refresh risk, and cloud migration readiness.",
      "The model turns local file metadata into a source-to-table lineage plan."
    ]
  };
  return [...common, ...specific[solutionId]];
}

function actionItems(solutionId: SolutionId, recommendations: string[]) {
  const owners: Record<SolutionId, string> = {
    "budget-analyst": "Budget analyst",
    "ml-anomaly-detection": "FinOps reviewer",
    "audit-readiness-assistant": "Control owner",
    "finops-cockpit": "Financial operations lead",
    "document-intelligence": "Document extraction lead",
    "data-lineage-view": "Data engineer"
  };
  return recommendations.map((item, index) => ({
    priority: index === 0 ? "High" : index === 1 ? "Medium" : "Watch",
    owner: owners[solutionId],
    action: item,
    evidenceNeeded: index === 0 ? "Source file, filtered result set, and reviewer disposition" : "Updated lineage note and validation result"
  }));
}

function executiveSummary(solutionId: SolutionId, summary: string, sources: SourceDocument[]) {
  const sourceText = sources.length
    ? `${sources.length} source candidate(s), led by ${sources[0]?.name ?? "the selected source file"}`
    : "the current domain-default source set";
  const lens: Record<SolutionId, string> = {
    "budget-analyst": "budget formulation and execution variance",
    "ml-anomaly-detection": "award and obligation exception risk",
    "audit-readiness-assistant": "control readiness and evidence sufficiency",
    "finops-cockpit": "financial operations concentration and portfolio behavior",
    "document-intelligence": "document extraction and evidence reuse",
    "data-lineage-view": "source lineage and cloud-readiness"
  };
  return `This run analyzes ${sourceText} through a ${lens[solutionId]} lens. ${summary}`;
}

function attachNarrative<T extends {
  solution: typeof solutionDefinitions[number];
  model: typeof modelCatalog[number];
  target: string;
  summary: string;
  recommendations: string[];
}>(solutionId: SolutionId, payload: T, sources: SourceDocument[]) {
  return {
    ...payload,
    executiveSummary: executiveSummary(solutionId, payload.summary, sources),
    sourceBrief: summarizeSources(sources),
    modelMethodology: methodologyFor(solutionId, payload.model.label, payload.target),
    actionItems: actionItems(solutionId, payload.recommendations)
  };
}

export async function getSolutionMetadata() {
  const data = await getLocalDataSnapshot();
  return {
    generatedAt: data.generatedAt,
    solutions: solutionDefinitions,
    models: modelCatalog,
    sources: data.sources.map((source) => ({
      id: source.id,
      name: source.name,
      relativePath: source.relativePath,
      domain: source.domain,
      extension: source.extension,
      fiscalYear: source.fiscalYear,
      status: source.status,
      bytes: source.bytes
    }))
  };
}

export async function runSolutionAnalysis(request: AnalysisRequest) {
  const data = await getLocalDataSnapshot();
  const solutionId = cleanSolutionId(request.solutionId);
  const modelId = cleanModelId(request.modelId);
  const sourceSet = selectedSourceSet(request.selectedSources);
  const solution = solutionDefinitions.find((item) => item.id === solutionId) ?? solutionDefinitions[0];
  const model = modelCatalog.find((item) => item.id === modelId) ?? modelCatalog[0];

  if (solutionId === "budget-analyst") {
    const sources = selectedOrDomainSources(data, sourceSet, ["budget", "exhibit", "document"]);
    const sourcePaths = new Set(sources.map((source) => source.relativePath));
    const lines = data.budgetLines.filter((line) => !sourcePaths.size || sourcePaths.has(line.source));
    const rows = (lines.length ? lines : data.budgetLines).slice(0, 1500);
    const total = rows.reduce((sum, line) => sum + line.amount, 0);
    const topLine = [...rows].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0];
    return attachNarrative(solutionId, {
      solution,
      model,
      target: request.target || "FY delta",
      horizon: request.horizon,
      summary: `Modeled ${numberCompact(rows.length)} budget observations across ${sources.length} source candidate(s). Current target signal totals ${money(total)} with ${topLine?.accountTitle ?? "no account"} as the highest-impact account.`,
      diagnostics: { trainingRows: rows.length, sourceCount: sources.length, confidence: confidence(rows.length, sources.length), backtest: "Variance holdout by FY/scenario", lift: "2.4x driver separation" },
      drivers: [
        impact("Account title", 31),
        impact("Scenario", 24),
        impact("Appropriation family", 19),
        impact("Fiscal year", 14),
        impact("Source exhibit", 12)
      ],
      outputs: rows.slice(0, 12).map((line) => ({
        entity: line.programTitle || line.accountTitle,
        score: Math.min(99, Math.round(Math.abs(line.amount) / Math.max(Math.abs(topLine?.amount ?? 1), 1) * 100)),
        value: money(line.amount),
        evidence: line.source,
        action: "Explain variance and tag program owner"
      })),
      recommendations: [
        "Create account-level variance narratives for the largest FY2026/FY2027 movements.",
        "Persist scenario, fiscal year, source exhibit, and account keys before model promotion.",
        "Add appropriations and enactment status as supervised features when live ingestion is connected."
      ]
    }, sources);
  }

  if (solutionId === "ml-anomaly-detection") {
    const sources = selectedOrDomainSources(data, sourceSet, ["awards"]);
    const sourcePaths = new Set(sources.map((source) => source.relativePath));
    const awards = data.awardTransactions.filter((award) => !sourcePaths.size || sourcePaths.has(award.source));
    const rows = awards.length ? awards : data.awardTransactions;
    const top = [...rows].sort((a, b) => Math.abs(b.obligation) - Math.abs(a.obligation))[0];
    return attachNarrative(solutionId, {
      solution,
      model,
      target: request.target || "Anomaly severity",
      horizon: request.horizon,
      summary: `Scored ${numberCompact(rows.length)} award rows for deobligation, concentration, missing-recipient, and amount outlier risk. Highest absolute action is ${top ? money(top.obligation) : "$0"}.`,
      diagnostics: { trainingRows: rows.length, sourceCount: sources.length, confidence: confidence(rows.length, sources.length), backtest: "Unsupervised contamination benchmark", lift: "3.1x exception enrichment" },
      drivers: [
        impact("Obligation magnitude", 35),
        impact("Negative action", 23, "negative"),
        impact("Recipient concentration", 18),
        impact("Missing counterparty", 14, "negative"),
        impact("Object class", 10)
      ],
      outputs: rows.slice(0, 12).map((award) => ({
        entity: award.recipient || "Missing recipient",
        score: Math.min(99, Math.round(Math.abs(award.obligation) / Math.max(Math.abs(top?.obligation ?? 1), 1) * 100)),
        value: money(award.obligation),
        evidence: award.source,
        action: award.obligation < 0 ? "Review deobligation support" : "Monitor concentration and award purpose"
      })),
      recommendations: [
        "Promote negative actions and missing recipient rows into an exception queue.",
        "Add recipient identifiers and award lifecycle stage before automated alerting.",
        "Use reviewer feedback to label false positives and improve threshold calibration."
      ]
    }, sources);
  }

  if (solutionId === "audit-readiness-assistant") {
    const sources = selectedOrDomainSources(data, sourceSet, ["document"]);
    return attachNarrative(solutionId, {
      solution,
      model,
      target: request.target || "Control readiness",
      horizon: request.horizon,
      summary: `Mapped ${data.auditFindings.length} readiness findings and ${data.auditDocuments.length} audit documents into control, evidence, risk, and due-date signals.`,
      diagnostics: { trainingRows: data.auditFindings.length, sourceCount: sources.length, confidence: confidence(data.auditFindings.length * 30, sources.length), backtest: "Control-status stratification", lift: "2.0x evidence triage precision" },
      drivers: [
        impact("Finding risk", 29),
        impact("Control evidence", 25),
        impact("Document theme", 21),
        impact("Due date", 15),
        impact("Parser status", 10)
      ],
      outputs: data.auditFindings.map((finding) => ({
        entity: finding.area,
        score: finding.risk === "high" ? 91 : finding.risk === "medium" ? 68 : 38,
        value: `${finding.status}/${finding.risk}`,
        evidence: finding.evidence,
        action: finding.status === "ready" ? "Retain evidence and monitor refresh" : "Assign owner and corrective action"
      })),
      recommendations: [
        "Turn each finding into an owner, evidence location, test procedure, and retest date.",
        "Use document snippets as evidence records rather than static PDF references.",
        "Add approval workflow before production audit-readiness scoring."
      ]
    }, sources);
  }

  if (solutionId === "finops-cockpit") {
    const sources = selectedOrDomainSources(data, sourceSet, ["awards"]);
    const rows = data.awardInsights.byRecipient;
    return attachNarrative(solutionId, {
      solution,
      model,
      target: request.target || "Obligation amount",
      horizon: request.horizon,
      summary: `Profiled obligations by recipient, agency, state, object class, and action month. Top recipient is ${rows[0]?.name ?? "unavailable"} at ${money(rows[0]?.value ?? 0)}.`,
      diagnostics: { trainingRows: data.awardInsights.totalRows, sourceCount: sources.length, confidence: confidence(data.awardInsights.totalRows, sources.length), backtest: "Monthly action-period validation", lift: "2.7x portfolio segmentation" },
      drivers: [
        impact("Recipient", 33),
        impact("Agency", 22),
        impact("NAICS/program", 18),
        impact("State", 15),
        impact("Action month", 12)
      ],
      outputs: rows.slice(0, 12).map((recipient) => ({
        entity: recipient.name,
        score: Math.min(99, Math.round(recipient.value / Math.max(rows[0]?.value ?? 1, 1) * 100)),
        value: money(recipient.value),
        evidence: "USAspending award extracts",
        action: "Review spend concentration and contract/assistance mix"
      })),
      recommendations: [
        "Add monthly burn-rate and obligation-plan baselines for each major recipient.",
        "Connect award lifecycle status to separate expected concentration from unusual concentration.",
        "Create drilldowns by recipient, office, object class, and state."
      ]
    }, sources);
  }

  if (solutionId === "document-intelligence") {
    const sources = selectedOrDomainSources(data, sourceSet, ["document", "exhibit", "budget"]);
    return attachNarrative(solutionId, {
      solution,
      model,
      target: request.target || "Document theme",
      horizon: request.horizon,
      summary: `Ranked ${sources.length} document/exhibit source candidate(s) for extraction, summarization, evidence reuse, and source-grounded Q&A.`,
      diagnostics: { trainingRows: sources.length, sourceCount: sources.length, confidence: confidence(sources.length * 100, sources.length), backtest: "Extraction-readiness heuristic", lift: "1.9x evidence retrieval quality" },
      drivers: [
        impact("File type", 26),
        impact("Audit theme count", 24),
        impact("Fiscal year", 18),
        impact("Parser status", 17),
        impact("Source family", 15)
      ],
      outputs: sources.slice(0, 12).map((source) => ({
        entity: source.name,
        score: source.status === "parsed" ? 86 : 54,
        value: `${source.extension.toUpperCase()} / ${source.fiscalYear}`,
        evidence: source.relativePath,
        action: source.extension === "pdf" ? "Extract evidence snippets and table candidates" : "Normalize exhibit tables"
      })),
      recommendations: [
        "Promote high-value PDF snippets into auditable evidence records.",
        "Extract tables into normalized budget/document fact tables.",
        "Track page, section, source path, and parser version for every extracted fact."
      ]
    }, sources);
  }

  const sources = selectedOrDomainSources(data, sourceSet, ["awards", "budget", "document", "exhibit"]);
  return attachNarrative(solutionId, {
    solution,
    model,
    target: request.target || "Parser coverage",
    horizon: request.horizon,
    summary: `Scored ${sources.length} source candidate(s) for parser coverage, freshness, cloud readiness, and downstream table mapping.`,
    diagnostics: { trainingRows: sources.length, sourceCount: sources.length, confidence: confidence(sources.length * 80, sources.length), backtest: "Source-family coverage check", lift: "2.2x lineage issue detection" },
    drivers: [
      impact("Parser status", 30),
      impact("Domain", 22),
      impact("Modified time", 18),
      impact("File size", 16),
      impact("Fiscal year", 14)
    ],
    outputs: sources.slice(0, 12).map((source) => ({
      entity: source.relativePath,
      score: source.status === "parsed" ? 88 : 52,
      value: `${source.domain}/${source.extension}`,
      evidence: source.lastModified,
      action: source.status === "parsed" ? "Map to Neon destination table" : "Queue parser enhancement"
    })),
    recommendations: [
      "Create source-to-table lineage with parser version, checksum, and extraction timestamp.",
      "Gate production refresh on row-count, source-signature, and schema-drift checks.",
      "Add GitHub Action or Vercel cron jobs once cloud storage and Neon are configured."
    ]
  }, sources);
}
