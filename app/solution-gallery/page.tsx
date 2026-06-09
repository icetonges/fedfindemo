import { Bot, Brain, FileText, GitBranch, LineChart, ShieldCheck, Workflow } from "lucide-react";
import { getLocalDataSnapshot } from "@/lib/source-data";

const solutions = [
  {
    title: "AI budget analyst",
    icon: Bot,
    summary: "Explains budget-book changes, fiscal-year comparisons, and variance drivers from structured DoD sources.",
    evidence: "DoD JSON budget books plus PDF budget overview corpus"
  },
  {
    title: "ML anomaly detection",
    icon: Brain,
    summary: "Flags negative obligation actions, missing recipients, extraction gaps, and unusual award concentrations.",
    evidence: "USAspending prime and subaward CSV extracts"
  },
  {
    title: "Audit readiness assistant",
    icon: ShieldCheck,
    summary: "Maps findings to controls, evidence files, due dates, and corrective-action status.",
    evidence: "Local data lineage, parser status, and exception queues"
  },
  {
    title: "FinOps cockpit",
    icon: LineChart,
    summary: "Profiles obligations, vendors, agencies, transactions, and burn-rate proxies from award data.",
    evidence: "Parsed award rows and obligation fields"
  },
  {
    title: "Document intelligence",
    icon: FileText,
    summary: "Queues PDF and spreadsheet budget exhibits for table extraction, summary, and source-grounded Q&A.",
    evidence: "FY2026/FY2027 PDF and XLSX exhibit inventory"
  },
  {
    title: "Data lineage view",
    icon: GitBranch,
    summary: "Connects local files, parsed APIs, future Neon records, and scheduled public-source ingestion.",
    evidence: "source_documents schema and API provenance"
  }
];

export default function SolutionGalleryPage() {
  const data = getLocalDataSnapshot();
  return (
    <div className="page">
      <header className="page-header">
        <div className="header-copy">
          <p className="eyebrow">Solution Gallery</p>
          <h1>AI, ML, automation, and modern architecture applied to federal finance problems.</h1>
          <p>Each module is wired to the local source inventory now and can graduate to Neon-backed live ingestion in later stages.</p>
        </div>
        <span className="pill"><Workflow size={14} /> {data.sources.length} source-backed demos</span>
      </header>

      <section className="grid cols-3">
        {solutions.map((solution) => {
          const Icon = solution.icon;
          return (
            <article className="card metric" key={solution.title}>
              <div className="metric-top">
                <h2>{solution.title}</h2>
                <div className="metric-icon"><Icon size={18} /></div>
              </div>
              <p>{solution.summary}</p>
              <span className="mini">{solution.evidence}</span>
            </article>
          );
        })}
      </section>
    </div>
  );
}
