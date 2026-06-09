export type SourceType = "csv" | "json" | "pdf" | "xlsx" | "other";

export type SourceDocument = {
  id: string;
  name: string;
  relativePath: string;
  folder: string;
  extension: SourceType;
  bytes: number;
  fiscalYear: string;
  agency: string;
  domain: "awards" | "budget" | "document" | "exhibit";
  status: "parsed" | "inventoried" | "queued";
};

export type AwardAggregate = {
  file: string;
  awardType: "contract" | "assistance";
  tier: "prime" | "subaward";
  rows: number;
  totalObligation: number;
  totalAwardValue: number;
  negativeActions: number;
  missingRecipientRows: number;
  fiscalYears: Record<string, number>;
  agencies: Record<string, number>;
  recipients: Record<string, number>;
};

export type BudgetBookSummary = {
  file: string;
  title: string;
  agency: string;
  budgetYear: string;
  submissionDate: string;
  appropriation: string;
  nodeCount: number;
  exhibitCount: number;
  numericFactCount: number;
  largestNumericFacts: Array<{ label: string; value: number }>;
};

export type FinancialAnomaly = {
  id: string;
  severity: "high" | "medium" | "watch";
  category: string;
  title: string;
  detail: string;
  source: string;
  amount?: number;
};

export type AuditFinding = {
  id: string;
  area: string;
  status: "open" | "monitoring" | "ready";
  risk: "high" | "medium" | "low";
  finding: string;
  control: string;
  evidence: string;
  dueDate: string;
};

export type LocalDataSnapshot = {
  generatedAt: string;
  sources: SourceDocument[];
  awards: AwardAggregate[];
  budgetBooks: BudgetBookSummary[];
  anomalies: FinancialAnomaly[];
  auditFindings: AuditFinding[];
  intelligenceItems: Array<{
    id: string;
    title: string;
    category: string;
    source: string;
    summary: string;
    priority: "high" | "medium" | "watch";
  }>;
};
