import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceRoot = path.join(root, "sourcedata");
const outputFile = path.join(root, "generated", "local-data.json");

const moneyFields = [
  "federal_action_obligation",
  "total_dollars_obligated",
  "total_obligated_amount",
  "prime_award_amount",
  "subaward_amount",
  "current_total_value_of_award",
  "base_and_all_options_value"
];
const recipientFields = ["recipient_name", "recipient_name_raw", "prime_awardee_name", "subawardee_name", "awardee_or_recipient_legal", "recipient_legal_entity_name"];
const agencyFields = ["awarding_agency_name", "prime_award_awarding_agency_name", "funding_agency_name", "prime_award_funding_agency_name"];
const fyFields = ["action_date_fiscal_year", "prime_award_base_action_date_fiscal_year", "prime_award_latest_action_date_fiscal_year", "period_of_performance_start_date"];

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

function sourceType(file) {
  const ext = path.extname(file).slice(1).toLowerCase();
  return ["csv", "json", "pdf", "xlsx"].includes(ext) ? ext : "other";
}

function inferFiscalYear(file) {
  return file.match(/FY\s?(\d{4})|20\d{2}/i)?.[0].replace(/^FY\s?/i, "") ?? "Unknown";
}

function inferAgency(file) {
  if (file.includes("USASPENDING")) return "USAspending";
  if (file.includes("dod-") || file.includes("DoD") || file.includes("DoW")) return "Department of Defense";
  return "Federal";
}

function inferDomain(file) {
  const ext = sourceType(file);
  if (ext === "csv") return "awards";
  if (ext === "json") return "budget";
  if (ext === "xlsx") return "exhibit";
  return "document";
}

function splitCsvLine(line) {
  const values = [];
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

function numberValue(value) {
  if (!value) return 0;
  const parsed = Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstPresent(row, fields) {
  for (const field of fields) {
    const value = row[field];
    if (value && value.trim()) return value.trim();
  }
  return "";
}

function addCount(target, key, amount = 1) {
  if (!key) return;
  target[key] = (target[key] ?? 0) + amount;
}

function buildInventory() {
  return listFiles(sourceRoot).map((file, index) => {
    const relativePath = path.relative(root, file).replaceAll(path.sep, "/");
    const folder = path.relative(sourceRoot, path.dirname(file)).replaceAll(path.sep, "/") || "sourcedata";
    const extension = sourceType(file);
    return {
      id: `src-${index + 1}`,
      name: path.basename(file),
      relativePath,
      folder,
      extension,
      bytes: fs.statSync(file).size,
      fiscalYear: inferFiscalYear(file),
      agency: inferAgency(file),
      domain: inferDomain(file),
      status: extension === "csv" || extension === "json" ? "parsed" : "inventoried"
    };
  });
}

function parseAwardCsv(file) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines[0]);
  const aggregate = {
    file: path.relative(root, file).replaceAll(path.sep, "/"),
    awardType: file.toLowerCase().includes("contract") ? "contract" : "assistance",
    tier: file.toLowerCase().includes("subaward") ? "subaward" : "prime",
    rows: 0,
    totalObligation: 0,
    totalAwardValue: 0,
    negativeActions: 0,
    missingRecipientRows: 0,
    fiscalYears: {},
    agencies: {},
    recipients: {}
  };
  for (const line of lines.slice(1)) {
    const values = splitCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    const obligation = numberValue(firstPresent(row, moneyFields.slice(0, 4)));
    const awardValue = numberValue(firstPresent(row, moneyFields));
    const recipient = firstPresent(row, recipientFields);
    const agency = firstPresent(row, agencyFields) || "Unspecified agency";
    const fiscalYear = firstPresent(row, fyFields).match(/\d{4}/)?.[0] ?? "Unknown";
    aggregate.rows += 1;
    aggregate.totalObligation += obligation;
    aggregate.totalAwardValue += awardValue;
    if (obligation < 0) aggregate.negativeActions += 1;
    if (!recipient) aggregate.missingRecipientRows += 1;
    addCount(aggregate.fiscalYears, fiscalYear);
    addCount(aggregate.agencies, agency);
    addCount(aggregate.recipients, recipient || "Missing recipient");
  }
  return aggregate;
}

function collectBudgetNodes(node, stats, context = "") {
  if (!node || typeof node !== "object") return;
  const output = node.GeneratedOutput;
  if (output) {
    stats.nodes += 1;
    const label = [String(output.Name ?? ""), String(output.Description ?? "")].filter(Boolean).join(" ");
    if (String(output.Type ?? "").toLowerCase().includes("exhibit")) stats.exhibits += 1;
    context = label || context;
  }
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === "string" || typeof value === "number") {
      const numeric = typeof value === "number" ? value : numberValue(value);
      if (/amount|total|fund|cost|estimate|fy|budget|obligation|outlay/i.test(key) && Math.abs(numeric) > 0) {
        stats.facts.set(`${context || "Budget fact"} - ${key}`, numeric);
      }
    } else if (Array.isArray(value)) {
      value.forEach((child) => collectBudgetNodes(child, stats, context));
    } else if (value && typeof value === "object") {
      collectBudgetNodes(value, stats, context);
    }
  }
}

function parseBudgetJson(file) {
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  const metadata = json.Metadata ?? {};
  const output = json.GeneratedOutput ?? {};
  const stats = { nodes: 0, exhibits: 0, facts: new Map() };
  collectBudgetNodes(json, stats);
  return {
    file: path.relative(root, file).replaceAll(path.sep, "/"),
    title: String(output.Description || output.Name || path.basename(file)),
    agency: String(metadata.ServiceAgencyName || "Department of Defense"),
    budgetYear: String(metadata.BudgetYear || inferFiscalYear(file)),
    submissionDate: String(metadata.SubmissionDate || "Unknown"),
    appropriation: String(metadata.AppropriationNumber || "Unknown"),
    nodeCount: stats.nodes,
    exhibitCount: stats.exhibits,
    numericFactCount: stats.facts.size,
    largestNumericFacts: [...stats.facts.entries()]
      .map(([label, value]) => ({ label: label.slice(0, 96), value }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 8)
  };
}

function buildAnomalies(awards, budgetBooks) {
  const anomalies = [];
  awards.forEach((award, index) => {
    if (award.negativeActions > 0) {
      anomalies.push({
        id: `anom-negative-${index}`,
        severity: award.negativeActions > 10 ? "high" : "medium",
        category: "Obligation reversals",
        title: `${award.negativeActions.toLocaleString()} negative actions in ${award.awardType} ${award.tier} data`,
        detail: "Potential deobligations or corrections should be tied to spend plans and closeout evidence.",
        source: award.file,
        amount: award.totalObligation
      });
    }
    if (award.missingRecipientRows > 0) {
      anomalies.push({
        id: `anom-recipient-${index}`,
        severity: "watch",
        category: "Data quality",
        title: `${award.missingRecipientRows.toLocaleString()} rows missing recipient names`,
        detail: "Missing counterparties reduce vendor-risk scoring and audit traceability.",
        source: award.file
      });
    }
  });
  budgetBooks.filter((book) => book.numericFactCount === 0).forEach((book, index) => {
    anomalies.push({
      id: `anom-budget-${index}`,
      severity: "watch",
      category: "Document extraction",
      title: `No numeric budget facts extracted from ${book.title}`,
      detail: "The parser inventoried the book, but table extraction should be improved before Neon normalization.",
      source: book.file
    });
  });
  return anomalies.slice(0, 12);
}

function buildAuditFindings(awards, sources) {
  const csvCoverage = sources.filter((source) => source.extension === "csv" && source.status === "parsed").length;
  const inventoriedDocs = sources.filter((source) => source.status === "inventoried").length;
  const missingRecipientRows = awards.reduce((sum, award) => sum + award.missingRecipientRows, 0);
  const negativeActions = awards.reduce((sum, award) => sum + award.negativeActions, 0);
  return [
    {
      id: "finding-lineage",
      area: "Data lineage",
      status: "ready",
      risk: "low",
      finding: `${sources.length} local files have source-path provenance and type classification.`,
      control: "Every normalized record carries source path, fiscal year, agency, source type, and extraction timestamp.",
      evidence: "Data Sources inventory and /api/data-sources response",
      dueDate: "Continuous"
    },
    {
      id: "finding-csv",
      area: "Award completeness",
      status: missingRecipientRows > 0 ? "open" : "ready",
      risk: missingRecipientRows > 0 ? "medium" : "low",
      finding: `${missingRecipientRows.toLocaleString()} award rows need recipient enrichment across ${csvCoverage} parsed CSV files.`,
      control: "Recipient and agency fields are profiled during local ingestion before Neon load.",
      evidence: "FinOps Monitor data-quality panel",
      dueDate: "2026-07-15"
    },
    {
      id: "finding-obligations",
      area: "Obligation monitoring",
      status: negativeActions > 0 ? "monitoring" : "ready",
      risk: negativeActions > 20 ? "high" : "medium",
      finding: `${negativeActions.toLocaleString()} negative obligation actions are candidates for variance explanation.`,
      control: "Exception queue links deobligations to spend-plan variance and award closeout review.",
      evidence: "ML anomaly detection queue",
      dueDate: "2026-08-01"
    },
    {
      id: "finding-docs",
      area: "Document intelligence",
      status: "monitoring",
      risk: "medium",
      finding: `${inventoriedDocs.toLocaleString()} PDF/XLSX files are inventoried and queued for deeper text/table extraction.`,
      control: "Document parser backlog is tracked with fiscal year, agency, and document type metadata.",
      evidence: "Budget Lab and Data Sources",
      dueDate: "2026-08-30"
    }
  ];
}

const sources = buildInventory();
const awards = sources.filter((source) => source.extension === "csv").map((source) => parseAwardCsv(path.join(root, source.relativePath)));
const budgetBooks = sources.filter((source) => source.extension === "json").map((source) => parseBudgetJson(path.join(root, source.relativePath)));
const anomalies = buildAnomalies(awards, budgetBooks);
const auditFindings = buildAuditFindings(awards, sources);
const topVendor = awards
  .flatMap((award) => Object.entries(award.recipients).sort((a, b) => b[1] - a[1]).slice(0, 1))
  .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "No vendor data";

const snapshot = {
  generatedAt: new Date().toISOString(),
  sources,
  awards,
  budgetBooks,
  anomalies,
  auditFindings,
  intelligenceItems: [
    {
      id: "intel-budget-books",
      title: "DoD budget-book corpus ready for budget formulation lab",
      category: "Document intelligence",
      source: "sourcedata/dod-pdf and sourcedata/dod-json",
      summary: `${budgetBooks.length} structured budget books and ${sources.filter((source) => source.extension === "pdf").length} PDFs are available for fiscal-year comparisons and source-grounded summaries.`,
      priority: "high"
    },
    {
      id: "intel-awards",
      title: "USAspending award extracts provide obligation and counterparty baseline",
      category: "FinOps",
      source: "sourcedata/sAMPLE DATA 1 USASPENDING",
      summary: `${awards.reduce((sum, award) => sum + award.rows, 0).toLocaleString()} transactions/subawards are parsed, with ${topVendor} currently the highest-frequency named counterparty.`,
      priority: "high"
    },
    {
      id: "intel-neon",
      title: "Neon schema can be loaded after local parser hardening",
      category: "Architecture",
      source: "INITIAL_APP_BLUEPRINT.md",
      summary: "The app exposes typed local APIs first, then can persist source_documents, budget_lines, award_transactions, audit_findings, and financial_anomalies.",
      priority: "medium"
    }
  ]
};

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Wrote ${path.relative(root, outputFile)} with ${sources.length} sources, ${awards.length} award aggregates, and ${budgetBooks.length} budget books.`);
