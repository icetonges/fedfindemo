import { ClipboardCheck, FileSearch, ShieldAlert, TimerReset } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { getLocalDataSnapshot, numberCompact } from "@/lib/source-data";

export default function AuditReadinessPage() {
  const data = getLocalDataSnapshot();
  const open = data.auditFindings.filter((finding) => finding.status === "open").length;
  const monitoring = data.auditFindings.filter((finding) => finding.status === "monitoring").length;
  const ready = data.auditFindings.filter((finding) => finding.status === "ready").length;
  const evidenceSources = data.sources.filter((source) => source.status === "parsed" || source.status === "inventoried").length;

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
        <MetricCard icon={ShieldAlert} label="Open findings" value={numberCompact(open)} detail="Issues requiring corrective action before production ingestion." />
        <MetricCard icon={TimerReset} label="Monitoring items" value={numberCompact(monitoring)} detail="Known risks with controls or extraction backlog in progress." />
        <MetricCard icon={ClipboardCheck} label="Ready controls" value={numberCompact(ready)} detail="Controls with current evidence in the local source inventory." />
        <MetricCard icon={FileSearch} label="Evidence sources" value={numberCompact(evidenceSources)} detail="Local files mapped to provenance and audit evidence." />
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
    </div>
  );
}
