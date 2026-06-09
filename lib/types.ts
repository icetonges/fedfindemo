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
  lastModified: string;
};

export type AmountBucket = {
  name: string;
  value: number;
  count: number;
};

export type AwardTransaction = {
  id: string;
  awardId: string;
  awardType: "contract" | "assistance";
  tier: "prime" | "subaward";
  recipient: string;
  agency: string;
  subAgency: string;
  office: string;
  fiscalYear: string;
  actionDate: string;
  obligation: number;
  awardValue: number;
  naics: string;
  productOrService: string;
  objectClass: string;
  state: string;
  description: string;
  source: string;
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

export type AwardInsights = {
  totalRows: number;
  totalObligations: number;
  totalAwardValue: number;
  negativeObligations: number;
  missingRecipients: number;
  byRecipient: AmountBucket[];
  byAgency: AmountBucket[];
  bySubAgency: AmountBucket[];
  byNaics: AmountBucket[];
  byObjectClass: AmountBucket[];
  byState: AmountBucket[];
  byFiscalYear: AmountBucket[];
  byMonth: AmountBucket[];
  awardTypeMix: AmountBucket[];
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

export type BudgetLine = {
  id: string;
  account: string;
  accountTitle: string;
  organization: string;
  budgetActivity: string;
  budgetActivityTitle: string;
  lineNumber: string;
  programCode: string;
  programTitle: string;
  fiscalYear: string;
  scenario: string;
  amount: number;
  appropriationFamily: string;
  classification: string;
  source: string;
};

export type BudgetInsights = {
  totalBudgetDollars: number;
  fy2026Total: number;
  fy2027Total: number;
  fy2027Request: number;
  byAccount: AmountBucket[];
  byActivity: AmountBucket[];
  byOrganization: AmountBucket[];
  byAppropriationFamily: AmountBucket[];
  byScenario: AmountBucket[];
  yearOverYear: Array<{
    accountTitle: string;
    fy2026: number;
    fy2027: number;
    delta: number;
    percent: number;
  }>;
  largestLines: BudgetLine[];
};

export type AuditDocument = {
  id: string;
  title: string;
  source: string;
  fiscalYear: string;
  pages: number;
  themes: Array<{ name: string; count: number }>;
  snippets: string[];
  status: "parsed" | "inventoried";
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
  sourceSignature: string;
  sources: SourceDocument[];
  awards: AwardAggregate[];
  awardTransactions: AwardTransaction[];
  awardInsights: AwardInsights;
  budgetBooks: BudgetBookSummary[];
  budgetLines: BudgetLine[];
  budgetInsights: BudgetInsights;
  auditDocuments: AuditDocument[];
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
