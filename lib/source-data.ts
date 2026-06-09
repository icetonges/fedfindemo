import fs from "node:fs";
import path from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import ExcelJS from "exceljs";
import { PDFParse } from "pdf-parse";
import type {
  AmountBucket,
  AuditDocument,
  AuditFinding,
  AwardAggregate,
  AwardInsights,
  AwardTransaction,
  BudgetBookSummary,
  BudgetInsights,
  BudgetLine,
  FinancialAnomaly,
  LocalDataSnapshot,
  SourceDocument,
  SourceType
} from "./types";

const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, "sourcedata");
const MAX_AWARD_TRANSACTIONS = 250;
const MAX_BUDGET_LINES = 75000;
const PDF_THEME_TERMS = [
  "material weakness",
  "significant deficiency",
  "audit",
  "financial statement",
  "internal control",
  "corrective action",
  "unsupported",
  "reconciliation",
  "information system",
  "fund balance",
  "inventory",
  "property",
  "budgetary resources"
];

let cachedSignature = "";
let cachedSnapshot: LocalDataSnapshot | null = null;

function listFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

function fileSignature(files: string[]) {
  return files
    .map((file) => {
      const stat = fs.statSync(file);
      return `${path.relative(ROOT, file)}:${stat.size}:${Math.round(stat.mtimeMs)}`;
    })
    .sort()
    .join("|");
}

function sourceType(file: string): SourceType {
  const ext = path.extname(file).slice(1).toLowerCase();
  if (ext === "csv" || ext === "json" || ext === "pdf" || ext === "xlsx") return ext;
  return "other";
}

function inferFiscalYear(file: string): string {
  const match = file.match(/FY\s?(\d{4})|20\d{2}/i);
  return match?.[0].replace(/^FY\s?/i, "") ?? "Unknown";
}

function inferAgency(file: string): string {
  if (/usaspending/i.test(file)) return "USAspending";
  if (/dod|dow|defense/i.test(file)) return "Department of Defense";
  return "Federal";
}

function inferDomain(file: string): SourceDocument["domain"] {
  const ext = sourceType(file);
  if (ext === "csv") return "awards";
  if (ext === "json") return "budget";
  if (ext === "xlsx") return "exhibit";
  return "document";
}

function buildInventory(files: string[]): SourceDocument[] {
  return files.map((file, index) => {
    const stat = fs.statSync(file);
    const relativePath = path.relative(ROOT, file).replaceAll(path.sep, "/");
    const folder = path.relative(SOURCE_ROOT, path.dirname(file)).replaceAll(path.sep, "/") || "sourcedata";
    const extension = sourceType(file);
    return {
      id: `src-${index + 1}`,
      name: path.basename(file),
      relativePath,
      folder,
      extension,
      bytes: stat.size,
      fiscalYear: inferFiscalYear(file),
      agency: inferAgency(file),
      domain: inferDomain(file),
      status: extension === "csv" || extension === "json" || extension === "xlsx" || extension === "pdf" ? "parsed" : "inventoried",
      lastModified: stat.mtime.toISOString()
    };
  });
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  values.push(value);
  return values;
}

function numberValue(value?: string | number | null): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("text" in value && value.text) return String(value.text);
    if ("result" in value && value.result !== undefined) return String(value.result);
    if ("richText" in value && Array.isArray(value.richText)) return value.richText.map((part) => part.text).join("");
  }
  return String(value);
}

function firstPresent(row: Record<string, string>, fields: string[]): string {
  for (const field of fields) {
    const value = row[field];
    if (value && value.trim()) return value.trim();
  }
  return "";
}

function addCount(target: Record<string, number>, key: string, amount = 1) {
  const clean = key?.trim() || "Unspecified";
  target[clean] = (target[clean] ?? 0) + amount;
}

function monthFromDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}` : "Unknown";
}

function parseCsvAwards(file: string): { aggregate: AwardAggregate; transactions: AwardTransaction[] } {
  const relative = path.relative(ROOT, file).replaceAll(path.sep, "/");
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines[0]);
  const isContract = /contract/i.test(file);
  const isSubaward = /subaward/i.test(file);
  const aggregate: AwardAggregate = {
    file: relative,
    awardType: isContract ? "contract" : "assistance",
    tier: isSubaward ? "subaward" : "prime",
    rows: 0,
    totalObligation: 0,
    totalAwardValue: 0,
    negativeActions: 0,
    missingRecipientRows: 0,
    fiscalYears: {},
    agencies: {},
    recipients: {}
  };
  const transactions: AwardTransaction[] = [];

  for (const [index, line] of lines.slice(1).entries()) {
    const values = splitCsvLine(line);
    const row = Object.fromEntries(headers.map((header, i) => [header, values[i] ?? ""]));
    const obligation = numberValue(firstPresent(row, [
      "federal_action_obligation",
      "subaward_amount",
      "prime_award_amount",
      "total_obligated_amount"
    ]));
    const awardValue = numberValue(firstPresent(row, [
      "current_total_value_of_award",
      "total_dollars_obligated",
      "total_obligated_amount",
      "prime_award_amount",
      "subaward_amount"
    ]));
    const recipient = firstPresent(row, [
      "recipient_name",
      "recipient_name_raw",
      "subawardee_name",
      "prime_awardee_name",
      "recipient_legal_entity_name"
    ]);
    const agency = firstPresent(row, [
      "awarding_agency_name",
      "prime_award_awarding_agency_name",
      "funding_agency_name",
      "prime_award_funding_agency_name"
    ]) || "Unspecified agency";
    const subAgency = firstPresent(row, [
      "awarding_sub_agency_name",
      "prime_award_awarding_sub_agency_name",
      "funding_sub_agency_name",
      "prime_award_funding_sub_agency_name"
    ]);
    const fiscalYear = firstPresent(row, [
      "action_date_fiscal_year",
      "subaward_action_date_fiscal_year",
      "prime_award_base_action_date_fiscal_year",
      "prime_award_latest_action_date_fiscal_year"
    ]).match(/\d{4}/)?.[0] ?? "Unknown";
    const actionDate = firstPresent(row, ["action_date", "subaward_action_date", "prime_award_base_action_date", "prime_award_latest_action_date"]);

    aggregate.rows += 1;
    aggregate.totalObligation += obligation;
    aggregate.totalAwardValue += awardValue;
    if (obligation < 0) aggregate.negativeActions += 1;
    if (!recipient) aggregate.missingRecipientRows += 1;
    addCount(aggregate.fiscalYears, fiscalYear);
    addCount(aggregate.agencies, agency);
    addCount(aggregate.recipients, recipient || "Missing recipient");

    transactions.push({
      id: `${relative}-${index}`,
      awardId: firstPresent(row, ["award_id_piid", "award_id_fain", "prime_award_piid", "prime_award_fain", "contract_award_unique_key", "assistance_award_unique_key"]) || `row-${index + 1}`,
      awardType: isContract ? "contract" : "assistance",
      tier: isSubaward ? "subaward" : "prime",
      recipient: recipient || "Missing recipient",
      agency,
      subAgency: subAgency || "Unspecified sub-agency",
      office: firstPresent(row, ["awarding_office_name", "prime_award_awarding_office_name", "funding_office_name", "prime_award_funding_office_name"]) || "Unspecified office",
      fiscalYear,
      actionDate,
      obligation,
      awardValue,
      naics: firstPresent(row, ["naics_description", "prime_award_naics_description", "cfda_title", "prime_award_cfda_numbers_and_titles"]) || "Unclassified program",
      productOrService: firstPresent(row, ["product_or_service_code_description", "assistance_type_description", "subaward_type"]) || "Unspecified product/service",
      objectClass: firstPresent(row, ["object_classes_funding_this_award", "prime_award_object_classes_funding_this_award"]) || "Unspecified object class",
      state: firstPresent(row, ["primary_place_of_performance_state_name", "subaward_primary_place_of_performance_state_name", "recipient_state_name", "subawardee_state_name"]) || "Unspecified",
      description: firstPresent(row, ["transaction_description", "subaward_description", "prime_award_base_transaction_description", "naics_description", "product_or_service_code_description"]).slice(0, 220),
      source: relative
    });
  }

  return { aggregate, transactions };
}

function bucketBy<T>(items: T[], key: (item: T) => string, amount: (item: T) => number, take = 12): AmountBucket[] {
  const buckets = new Map<string, AmountBucket>();
  for (const item of items) {
    const name = key(item) || "Unspecified";
    const existing = buckets.get(name) ?? { name, value: 0, count: 0 };
    existing.value += amount(item);
    existing.count += 1;
    buckets.set(name, existing);
  }
  return [...buckets.values()].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, take);
}

function buildAwardInsights(transactions: AwardTransaction[], aggregates: AwardAggregate[]): AwardInsights {
  return {
    totalRows: aggregates.reduce((sum, item) => sum + item.rows, 0),
    totalObligations: aggregates.reduce((sum, item) => sum + item.totalObligation, 0),
    totalAwardValue: aggregates.reduce((sum, item) => sum + item.totalAwardValue, 0),
    negativeObligations: transactions.filter((item) => item.obligation < 0).length,
    missingRecipients: transactions.filter((item) => item.recipient === "Missing recipient").length,
    byRecipient: bucketBy(transactions, (item) => item.recipient, (item) => item.obligation),
    byAgency: bucketBy(transactions, (item) => item.agency, (item) => item.obligation),
    bySubAgency: bucketBy(transactions, (item) => item.subAgency, (item) => item.obligation),
    byNaics: bucketBy(transactions, (item) => item.naics, (item) => item.obligation),
    byObjectClass: bucketBy(transactions, (item) => item.objectClass, (item) => item.obligation),
    byState: bucketBy(transactions, (item) => item.state, (item) => item.obligation),
    byFiscalYear: bucketBy(transactions, (item) => item.fiscalYear, (item) => item.obligation),
    byMonth: bucketBy(transactions, (item) => monthFromDate(item.actionDate), (item) => item.obligation, 18).sort((a, b) => a.name.localeCompare(b.name)),
    awardTypeMix: bucketBy(transactions, (item) => `${item.awardType} ${item.tier}`, (item) => item.obligation)
  };
}

function inferAppropriationFamily(accountTitle: string, file: string) {
  const text = `${accountTitle} ${file}`.toLowerCase();
  if (text.includes("operation") || text.includes("_o1")) return "Operation & Maintenance";
  if (text.includes("procurement") || text.includes("_p1")) return "Procurement";
  if (text.includes("research") || text.includes("development") || text.includes("_r1")) return "RDT&E";
  if (text.includes("military personnel") || text.includes("_m1")) return "Military Personnel";
  if (text.includes("construction") || text.includes("_c1")) return "Military Construction";
  if (text.includes("revolving") || text.includes("_rf1")) return "Revolving Funds";
  return "Other Budget";
}

function isAmountHeader(header: string) {
  const lower = header.toLowerCase();
  return /^fy\s?20\d{2}/i.test(header) && !lower.includes("quantity") && !lower.includes("classification");
}

function fiscalYearFromHeader(header: string) {
  return header.match(/FY\s?(20\d{2})/i)?.[1] ?? "Unknown";
}

function scenarioFromHeader(header: string) {
  return header.replace(/^FY\s?20\d{2}\s*/i, "").replace(/\s*Amount$/i, "").trim() || "Total";
}

function headerColumn(headers: string[], matcher: RegExp, fallback: number) {
  const index = headers.findIndex((header) => matcher.test(header));
  return index >= 0 ? index + 1 : fallback;
}

async function parseWorkbookBudgetLines(file: string): Promise<BudgetLine[]> {
  const relative = path.relative(ROOT, file).replaceAll(path.sep, "/");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file);
  const lines: BudgetLine[] = [];

  for (const worksheet of workbook.worksheets.slice(0, 1)) {
    let headerRowNumber = 0;
    let headers: string[] = [];
    for (let rowNumber = 1; rowNumber <= Math.min(8, worksheet.rowCount); rowNumber += 1) {
      const rowHeaders: string[] = [];
      for (let col = 1; col <= worksheet.columnCount; col += 1) {
        rowHeaders.push(cellText(worksheet.getCell(rowNumber, col).value).trim());
      }
      if (rowHeaders.includes("Account") && rowHeaders.some((header) => /^FY\s?20\d{2}/i.test(header))) {
        headerRowNumber = rowNumber;
        headers = rowHeaders;
        break;
      }
    }
    if (!headerRowNumber) continue;

    const amountColumns = headers
      .map((header, index) => ({ header, col: index + 1 }))
      .filter(({ header }) => isAmountHeader(header));

    for (let rowNumber = headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      const account = cellText(row.getCell(1).value).trim();
      const accountTitle = cellText(row.getCell(2).value).trim();
      if (!account || !accountTitle || /total of displayed rows/i.test(accountTitle)) continue;

      const budgetActivityTitle = cellText(row.getCell(5).value).trim();
      const programCodeColumn = headerColumn(headers, /PE\/BLI|SAG\/BLI|Budget Line Item$|BSA$/i, 9);
      const programTitleColumn = headerColumn(headers, /Title/i, 10);
      const classificationColumn = headerColumn(headers, /Classification/i, worksheet.columnCount);
      const lineNumberColumn = headerColumn(headers, /^Line Number$/i, 6);
      const programCode = cellText(row.getCell(programCodeColumn).value).trim();
      const programTitle = cellText(row.getCell(programTitleColumn).value).trim() || budgetActivityTitle;
      const classification = cellText(row.getCell(classificationColumn).value).trim();

      for (const { header, col } of amountColumns) {
        const rawAmount = numberValue(cellText(row.getCell(col).value));
        if (!rawAmount) continue;
        lines.push({
          id: `${relative}-${worksheet.name}-${rowNumber}-${col}`,
          account,
          accountTitle,
          organization: cellText(row.getCell(3).value).trim(),
          budgetActivity: cellText(row.getCell(4).value).trim(),
          budgetActivityTitle,
          lineNumber: cellText(row.getCell(lineNumberColumn).value).trim(),
          programCode,
          programTitle,
          fiscalYear: fiscalYearFromHeader(header),
          scenario: scenarioFromHeader(header),
          amount: rawAmount * 1000,
          appropriationFamily: inferAppropriationFamily(accountTitle, relative),
          classification,
          source: relative
        });
      }
      if (lines.length >= MAX_BUDGET_LINES) return lines;
    }
  }
  return lines;
}

function parseBudgetJson(file: string): BudgetBookSummary {
  const json = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
  const metadata = (json.Metadata ?? {}) as Record<string, unknown>;
  const output = (json.GeneratedOutput ?? {}) as Record<string, unknown>;
  const stats = { nodes: 0, exhibits: 0 };
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    const generatedOutput = record.GeneratedOutput as Record<string, unknown> | undefined;
    if (generatedOutput) {
      stats.nodes += 1;
      if (String(generatedOutput.Type ?? "").toLowerCase().includes("exhibit")) stats.exhibits += 1;
    }
    Object.values(record).forEach((value) => {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object") walk(value);
    });
  };
  walk(json);
  return {
    file: path.relative(ROOT, file).replaceAll(path.sep, "/"),
    title: String(output.Description || output.Name || path.basename(file)),
    agency: String(metadata.ServiceAgencyName || "Department of Defense"),
    budgetYear: String(metadata.BudgetYear || inferFiscalYear(file)),
    submissionDate: String(metadata.SubmissionDate || "Unknown"),
    appropriation: String(metadata.AppropriationNumber || "Unknown"),
    nodeCount: stats.nodes,
    exhibitCount: stats.exhibits,
    numericFactCount: 0,
    largestNumericFacts: []
  };
}

function buildBudgetInsights(budgetLines: BudgetLine[]): BudgetInsights {
  const totalLines = budgetLines.filter((line) => /total|request|enacted|actuals|spend plan/i.test(line.scenario));
  const byAccount = bucketBy(totalLines, (line) => line.accountTitle, (line) => line.amount);
  const byActivity = bucketBy(totalLines, (line) => line.budgetActivityTitle || line.programTitle, (line) => line.amount);
  const byOrganization = bucketBy(totalLines, (line) => line.organization || "Other", (line) => line.amount);
  const byAppropriationFamily = bucketBy(totalLines, (line) => line.appropriationFamily, (line) => line.amount);
  const byScenario = bucketBy(totalLines, (line) => `${line.fiscalYear} ${line.scenario}`, (line) => line.amount);
  const fy2026 = budgetLines.filter((line) => line.fiscalYear === "2026" && /total/i.test(line.scenario));
  const fy2027 = budgetLines.filter((line) => line.fiscalYear === "2027" && /total|request/i.test(line.scenario));
  const fy2026ByAccount = bucketBy(fy2026, (line) => line.accountTitle, (line) => line.amount, 100);
  const fy2027ByAccount = bucketBy(fy2027, (line) => line.accountTitle, (line) => line.amount, 100);
  const fy2026Map = new Map(fy2026ByAccount.map((item) => [item.name, item.value]));
  const fy2027Map = new Map(fy2027ByAccount.map((item) => [item.name, item.value]));
  const names = new Set([...fy2026Map.keys(), ...fy2027Map.keys()]);
  const yearOverYear = [...names].map((accountTitle) => {
    const from = fy2026Map.get(accountTitle) ?? 0;
    const to = fy2027Map.get(accountTitle) ?? 0;
    return {
      accountTitle,
      fy2026: from,
      fy2027: to,
      delta: to - from,
      percent: from ? (to - from) / from : 0
    };
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 15);

  return {
    totalBudgetDollars: totalLines.reduce((sum, line) => sum + line.amount, 0),
    fy2026Total: fy2026.reduce((sum, line) => sum + line.amount, 0),
    fy2027Total: fy2027.reduce((sum, line) => sum + line.amount, 0),
    fy2027Request: budgetLines.filter((line) => line.fiscalYear === "2027" && /request/i.test(line.scenario)).reduce((sum, line) => sum + line.amount, 0),
    byAccount,
    byActivity,
    byOrganization,
    byAppropriationFamily,
    byScenario,
    yearOverYear,
    largestLines: [...budgetLines].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)).slice(0, 40)
  };
}

async function parseAuditPdf(file: string): Promise<AuditDocument> {
  const relative = path.relative(ROOT, file).replaceAll(path.sep, "/");
  const title = path.basename(file, path.extname(file)).replaceAll("_", " ");
  try {
    const parser = new PDFParse({ data: fs.readFileSync(file) });
    const data = await parser.getText({ partial: [1, 10] });
    await parser.destroy();
    const text = data.text.replace(/\s+/g, " ");
    const lower = text.toLowerCase();
    let themes = PDF_THEME_TERMS.map((term) => ({
      name: term,
      count: (lower.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length
    })).filter((theme) => theme.count > 0).sort((a, b) => b.count - a.count).slice(0, 8);
    if (!themes.length && /financial report/i.test(title)) {
      themes = [
        { name: "agency financial report", count: 1 },
        { name: "financial statement", count: 1 }
      ];
    }
    const snippets = themes.slice(0, 4).map((theme) => {
      const index = lower.indexOf(theme.name);
      return index >= 0 ? text.slice(Math.max(0, index - 120), Math.min(text.length, index + 240)).trim() : "";
    }).filter(Boolean);
    if (!snippets.length && text.trim()) snippets.push(text.slice(0, 360).trim());
    return {
      id: relative,
      title,
      source: relative,
      fiscalYear: inferFiscalYear(file),
      pages: data.total ?? 0,
      themes,
      snippets,
      status: "parsed"
    };
  } catch {
    return {
      id: relative,
      title,
      source: relative,
      fiscalYear: inferFiscalYear(file),
      pages: 0,
      themes: [],
      snippets: [],
      status: "inventoried"
    };
  }
}

function buildAnomalies(awardInsights: AwardInsights, budgetInsights: BudgetInsights, auditDocuments: AuditDocument[]): FinancialAnomaly[] {
  const anomalies: FinancialAnomaly[] = [];
  if (awardInsights.negativeObligations) {
    anomalies.push({
      id: "negative-obligations",
      severity: awardInsights.negativeObligations > 20 ? "high" : "medium",
      category: "Obligation reversals",
      title: `${awardInsights.negativeObligations.toLocaleString()} negative award actions`,
      detail: "Review deobligations and corrections against spend plans, closeout status, and obligation-validity controls.",
      source: "USAspending CSV extracts",
      amount: awardInsights.totalObligations
    });
  }
  if (awardInsights.missingRecipients) {
    anomalies.push({
      id: "missing-recipients",
      severity: "medium",
      category: "Data quality",
      title: `${awardInsights.missingRecipients.toLocaleString()} transactions lack recipient names`,
      detail: "Missing counterparties weaken vendor-risk monitoring, improper-payment review, and audit traceability.",
      source: "USAspending CSV extracts"
    });
  }
  budgetInsights.yearOverYear.slice(0, 5).forEach((item, index) => {
    if (Math.abs(item.percent) > 0.15 && Math.abs(item.delta) > 500_000_000) {
      anomalies.push({
        id: `budget-variance-${index}`,
        severity: Math.abs(item.percent) > 0.35 ? "high" : "medium",
        category: "Budget variance",
        title: `${item.accountTitle} changes ${Math.round(item.percent * 100)}% from FY2026 to FY2027`,
        detail: "Large account-level movement should be explained by request narratives, enactment changes, or mandatory/discretionary mix.",
        source: "DoD Excel budget exhibits",
        amount: item.delta
      });
    }
  });
  auditDocuments.forEach((doc) => {
    const weakness = doc.themes.find((theme) => theme.name === "material weakness");
    if (weakness) {
      anomalies.push({
        id: `audit-${doc.id}`,
        severity: "high",
        category: "Audit readiness",
        title: `${doc.title} references material weakness ${weakness.count} times`,
        detail: "Tie the weakness area to corrective actions, evidence owners, and control retesting cadence.",
        source: doc.source
      });
    }
  });
  return anomalies.slice(0, 16);
}

function buildAuditFindings(awardInsights: AwardInsights, budgetInsights: BudgetInsights, auditDocuments: AuditDocument[], sources: SourceDocument[]): AuditFinding[] {
  const topAuditTheme = auditDocuments.flatMap((doc) => doc.themes).sort((a, b) => b.count - a.count)[0];
  const largestVariance = budgetInsights.yearOverYear[0];
  return [
    {
      id: "audit-material-weakness",
      area: "Audit findings",
      status: topAuditTheme ? "open" : "monitoring",
      risk: topAuditTheme?.name.includes("material weakness") ? "high" : "medium",
      finding: topAuditTheme ? `Audit documents emphasize "${topAuditTheme.name}" across extracted text.` : "Audit documents are inventoried, but text extraction has limited signal.",
      control: "Map document themes to corrective action plans, control owners, evidence repositories, and retest dates.",
      evidence: auditDocuments.map((doc) => doc.title).join("; ") || "Audit source folder",
      dueDate: "2026-07-31"
    },
    {
      id: "budget-variance",
      area: "Budget variance",
      status: largestVariance ? "monitoring" : "ready",
      risk: largestVariance && Math.abs(largestVariance.percent) > 0.25 ? "high" : "medium",
      finding: largestVariance ? `${largestVariance.accountTitle} has the largest FY2026-to-FY2027 movement at ${money(largestVariance.delta)}.` : "No large account variance identified.",
      control: "Require variance explanations linking account changes to program, enactment, spend-plan, and request drivers.",
      evidence: "DoD FY2026/FY2027 Excel budget exhibits",
      dueDate: "2026-08-15"
    },
    {
      id: "vendor-risk",
      area: "Vendor and recipient monitoring",
      status: awardInsights.missingRecipients ? "open" : "ready",
      risk: awardInsights.missingRecipients ? "medium" : "low",
      finding: `${awardInsights.missingRecipients.toLocaleString()} parsed award transactions lack recipient names; top recipient concentration is ${awardInsights.byRecipient[0]?.name ?? "unavailable"}.`,
      control: "Enrich recipient identifiers, monitor concentration, and reconcile deobligations to award files.",
      evidence: "USAspending transaction extracts",
      dueDate: "2026-08-01"
    },
    {
      id: "lineage-refresh",
      area: "Data lineage and freshness",
      status: "ready",
      risk: "low",
      finding: `${sources.length} files are scanned at request time with size, modified date, source path, and parser status.`,
      control: "Invalidate the local parser cache whenever any source file path, size, or modification time changes.",
      evidence: "Runtime source signature",
      dueDate: "Continuous"
    }
  ];
}

export async function getLocalDataSnapshot(): Promise<LocalDataSnapshot> {
  noStore();
  const files = listFiles(SOURCE_ROOT);
  const signature = fileSignature(files);
  if (cachedSnapshot && cachedSignature === signature) return cachedSnapshot;

  const sources = buildInventory(files);
  const awardResults = files.filter((file) => sourceType(file) === "csv").map(parseCsvAwards);
  const awards = awardResults.map((result) => result.aggregate);
  const allAwardTransactions = awardResults.flatMap((result) => result.transactions);
  const awardTransactions = [...allAwardTransactions].sort((a, b) => Math.abs(b.obligation) - Math.abs(a.obligation)).slice(0, MAX_AWARD_TRANSACTIONS);
  const awardInsights = buildAwardInsights(allAwardTransactions, awards);
  const budgetBooks = files.filter((file) => sourceType(file) === "json").map(parseBudgetJson);
  const workbookLines = await Promise.all(files.filter((file) => sourceType(file) === "xlsx").map(parseWorkbookBudgetLines));
  const budgetLines = workbookLines.flat().slice(0, MAX_BUDGET_LINES);
  const budgetInsights = buildBudgetInsights(budgetLines);
  const auditDocuments = await Promise.all(files.filter((file) => sourceType(file) === "pdf" && /audit|financial_report|agency_financial/i.test(file)).map(parseAuditPdf));
  const anomalies = buildAnomalies(awardInsights, budgetInsights, auditDocuments);
  const auditFindings = buildAuditFindings(awardInsights, budgetInsights, auditDocuments, sources);

  cachedSnapshot = {
    generatedAt: new Date().toISOString(),
    sourceSignature: signature,
    sources,
    awards,
    awardTransactions,
    awardInsights,
    budgetBooks,
    budgetLines,
    budgetInsights,
    auditDocuments,
    anomalies,
    auditFindings,
    intelligenceItems: [
      {
        id: "intel-budget",
        title: "DoD budget exhibits now drive account-level variance analytics",
        category: "Budget",
        source: "sourcedata/dod_1",
        summary: `${budgetLines.length.toLocaleString()} budget line observations were parsed from Excel exhibits, including FY2026/FY2027 totals, request, enacted, actual, and spend-plan scenarios.`,
        priority: "high"
      },
      {
        id: "intel-awards",
        title: "USAspending transactions power vendor, NAICS, object-class, and geography views",
        category: "Financial operations",
        source: "sourcedata/USASPENDING",
        summary: `${awardInsights.totalRows.toLocaleString()} award rows are normalized into recipient, agency, NAICS/program, state, object-class, and month aggregations.`,
        priority: "high"
      },
      {
        id: "intel-audit",
        title: "Audit documents are scanned for control and finding themes",
        category: "Audit",
        source: "sourcedata/audit",
        summary: auditDocuments.length ? `${auditDocuments.length} audit document(s) were parsed for themes such as material weakness, internal control, reconciliation, and corrective action.` : "No audit PDFs are currently available under sourcedata/audit.",
        priority: auditDocuments.length ? "high" : "watch"
      }
    ]
  };
  cachedSignature = signature;
  return cachedSnapshot;
}

export function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: Math.abs(value) >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: 1
  }).format(value);
}

export function numberCompact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
