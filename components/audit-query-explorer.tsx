"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

type AuditFindingRow = {
  id: string;
  area: string;
  status: string;
  risk: string;
  finding: string;
  control: string;
  evidence: string;
  dueDate: string;
};

type AuditPayload = {
  totalFindings: number;
  highRisk: number;
  open: number;
  findings: AuditFindingRow[];
};

export function AuditQueryExplorer() {
  const [status, setStatus] = useState("");
  const [risk, setRisk] = useState("");
  const [search, setSearch] = useState("");
  const [payload, setPayload] = useState<AuditPayload | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (risk) params.set("risk", risk);
    if (search) params.set("search", search);
    fetch(`/api/query/audit?${params.toString()}`)
      .then((response) => response.json())
      .then(setPayload)
      .catch(() => setPayload(null));
  }, [status, risk, search]);

  return (
    <section className="section">
      <div className="section-head">
        <h2>Interactive Audit Query</h2>
        <span className="pill">
          {payload ? `${payload.totalFindings.toLocaleString()} findings . ${payload.open} open . ${payload.highRisk} high risk` : "Loading"}
        </span>
      </div>
      <div className="card work-area">
        <div className="control-row">
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Finding status">
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="monitoring">Monitoring</option>
            <option value="ready">Ready</option>
          </select>
          <select value={risk} onChange={(event) => setRisk(event.target.value)} aria-label="Finding risk">
            <option value="">All risks</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <label className="search-box">
            <Search size={15} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search finding, control, or evidence" />
          </label>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Area</th>
                <th>Status</th>
                <th>Risk</th>
                <th>Finding</th>
                <th>Control</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {(payload?.findings ?? []).map((finding) => (
                <tr key={finding.id}>
                  <td>{finding.area}</td>
                  <td><span className={`status ${finding.status}`}>{finding.status}</span></td>
                  <td><span className={`status ${finding.risk}`}>{finding.risk}</span></td>
                  <td>{finding.finding}</td>
                  <td>{finding.control}</td>
                  <td>{finding.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
