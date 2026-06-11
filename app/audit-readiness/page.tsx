import { ClipboardCheck, FileSearch, ShieldAlert, TimerReset } from "lucide-react";
import { AuditQueryExplorer } from "@/components/audit-query-explorer";
import { KnowledgePanel } from "@/components/knowledge-panel";
import { MetricCard } from "@/components/metric-card";
import { knowledgePlaybooks } from "@/lib/knowledge-content";
import { getLocalDataSnapshot, numberCompact } from "@/lib/source-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AuditReadinessPage() {
  const data = await getLocalDataSnapshot();
  const open = data.auditFindings.filter((finding) => finding.status === "open").length;
  const monitoring = data.auditFindings.filter((finding) => finding.status === "monitoring").length;
  const ready = data.auditFindings.filter((finding) => finding.status === "ready").length;
  const evidenceSources = data.auditDocuments.length;

  return (
    <div className="page">
      <header className="page-header">
        <div className="header-copy">
          <p className="eyebrow">Audit Readiness</p>
          <h1>Findings, controls, evidence, corrective actions, and source traceability.</h1>
          <p>Prototype findings are generated from local ingestion coverage, recipient completeness, negative obligations, and document-extraction readiness.</p>
        </div>
      </header>

      <section className="grid cols-4">
        <MetricCard icon={ShieldAlert} label="Open findings" value={numberCompact(open)} detail="Issues requiring corrective action before production ingestion." href="/insights/audit" />
        <MetricCard icon={TimerReset} label="Monitoring items" value={numberCompact(monitoring)} detail="Known risks with controls or extraction backlog in progress." href="/insights/audit" />
        <MetricCard icon={ClipboardCheck} label="Ready controls" value={numberCompact(ready)} detail="Controls with current evidence in the local source inventory." href="/insights/audit" />
        <MetricCard icon={FileSearch} label="Audit PDFs parsed" value={numberCompact(evidenceSources)} detail="Audit and financial report PDFs are scanned for control themes and finding language." href="/insights/audit" />
      </section>

      <KnowledgePanel playbook={knowledgePlaybooks.audit} />

      <section className="grid cols-2">
        {data.auditDocuments.map((doc) => (
          <article className="card metric" key={doc.id}>
            <div className="metric-top">
              <div>
                <h2>{doc.title}</h2>
                <p className="mini">{doc.pages ? `${doc.pages} pages parsed` : "Inventoried"} . {doc.source}</p>
              </div>
              <span className={`status ${doc.status === "parsed" ? "ready" : "monitoring"}`}>{doc.status}</span>
            </div>
            <div className="pill-row">
              {doc.themes.slice(0, 6).map((theme) => (
                <span className="pill" key={`${doc.id}-${theme.name}`}>{theme.name}: {theme.count}</span>
              ))}
            </div>
            {doc.snippets[0] ? <p>{doc.snippets[0]}</p> : <p>No extractable audit text was available from this PDF.</p>}
          </article>
        ))}
      </section>

      <section className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Area</th>
              <th>Status</th>
              <th>Risk</th>
              <th>Finding</th>
              <th>Control</th>
              <th>Evidence</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {data.auditFindings.map((finding) => (
              <tr key={finding.id}>
                <td>{finding.area}</td>
                <td><span className={`status ${finding.status}`}>{finding.status}</span></td>
                <td><span className={`status ${finding.risk}`}>{finding.risk}</span></td>
                <td>{finding.finding}</td>
                <td>{finding.control}</td>
                <td>{finding.evidence}</td>
                <td>{finding.dueDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <AuditQueryExplorer />
    </div>
  );
}
