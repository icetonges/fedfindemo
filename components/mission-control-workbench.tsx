"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Gauge, Landmark, RefreshCw, ShieldCheck } from "lucide-react";

type MissionPayload = {
  generatedAt: string;
  posture: {
    readinessScore: number;
    sourceCoverage: number;
    topVendorShare: number;
    fy2027Request: number;
    latestSourceChange: string;
  };
  kpis: Array<{ label: string; value: number; tone: string }>;
  budget: {
    topFamily?: { name: string; value: number; count: number };
    yearOverYear: Array<{ accountTitle: string; fy2026: number; fy2027: number; delta: number; percent: number }>;
  };
  audit: {
    findings: Array<{ id: string; area: string; status: string; risk: string; finding: string; control: string; evidence: string; dueDate: string }>;
  };
  finops: {
    topRecipients: Array<{ name: string; value: number; count: number }>;
  };
  queue: Array<{ id: string; lane: string; priority: string; title: string; detail: string; source: string }>;
};

const tabs = ["Operations", "Budget", "Audit", "FinOps"] as const;

function dollars(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function numberCompact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function MissionControlWorkbench() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Operations");
  const [payload, setPayload] = useState<MissionPayload | null>(null);
  const [loading, setLoading] = useState(true);

  function loadMissionData(showSpinner: boolean) {
    if (showSpinner) setLoading(true);
    fetch("/api/mission-control")
      .then((response) => response.json())
      .then(setPayload)
      .catch(() => setPayload(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetch("/api/mission-control")
      .then((response) => response.json())
      .then(setPayload)
      .catch(() => setPayload(null))
      .finally(() => setLoading(false));
  }, []);

  const headline = useMemo(() => {
    if (!payload) return "Loading operational posture";
    if (activeTab === "Budget") return `${payload.budget.topFamily?.name ?? "Budget"} leads the FY request profile`;
    if (activeTab === "Audit") return `${payload.audit.findings.length} control findings in the readiness register`;
    if (activeTab === "FinOps") return `${payload.finops.topRecipients.length} counterparties drive the award view`;
    return `Readiness score ${payload.posture.readinessScore} with ${payload.queue.length} queued actions`;
  }, [activeTab, payload]);

  return (
    <section className="card command-center">
      <div className="command-head">
        <div>
          <p className="eyebrow">Command Workbench</p>
          <h2>{headline}</h2>
        </div>
        <button className="icon-button" type="button" onClick={() => loadMissionData(true)} aria-label="Refresh mission data" title="Refresh mission data">
          <RefreshCw size={17} className={loading ? "spin" : ""} />
        </button>
      </div>

      <div className="tab-row" role="tablist" aria-label="Mission control views">
        {tabs.map((tab) => (
          <button className={activeTab === tab ? "tab active" : "tab"} key={tab} type="button" onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {!payload ? (
        <div className="empty-state">Mission data is not available.</div>
      ) : (
        <>
          <div className="signal-grid">
            <div className="signal-card">
              <Gauge size={18} />
              <span>Readiness</span>
              <strong>{payload.posture.readinessScore}</strong>
            </div>
            <div className="signal-card">
              <ShieldCheck size={18} />
              <span>Source coverage</span>
              <strong>{payload.posture.sourceCoverage.toFixed(0)}%</strong>
            </div>
            <div className="signal-card">
              <Landmark size={18} />
              <span>FY2027 request</span>
              <strong>{dollars(payload.posture.fy2027Request)}</strong>
            </div>
            <div className="signal-card">
              <AlertTriangle size={18} />
              <span>Vendor concentration</span>
              <strong>{payload.posture.topVendorShare.toFixed(1)}%</strong>
            </div>
          </div>

          {activeTab === "Operations" && (
            <div className="workbench-grid">
              <div className="section">
                <div className="section-head">
                  <h3>Action Queue</h3>
                  <span className="mini">Refreshed {new Date(payload.generatedAt).toLocaleTimeString()}</span>
                </div>
                <div className="list compact-list">
                  {payload.queue.map((item) => (
                    <article className="list-item" key={item.id}>
                      <div className="pill-row">
                        <span className={`status ${item.priority}`}>{item.priority}</span>
                        <span className="mini">{item.lane}</span>
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.detail}</p>
                      <span className="mini">{item.source}</span>
                    </article>
                  ))}
                </div>
              </div>
              <div className="section">
                <h3>Operational KPIs</h3>
                <div className="kpi-list">
                  {payload.kpis.map((kpi) => (
                    <div className="kpi-line" key={kpi.label}>
                      <span>{kpi.label}</span>
                      <strong>{numberCompact(kpi.value)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "Budget" && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>FY2026</th>
                    <th>FY2027</th>
                    <th>Delta</th>
                    <th>Percent</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.budget.yearOverYear.map((row) => (
                    <tr key={row.accountTitle}>
                      <td>{row.accountTitle}</td>
                      <td>{dollars(row.fy2026)}</td>
                      <td>{dollars(row.fy2027)}</td>
                      <td>{dollars(row.delta)}</td>
                      <td>{row.percent.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "Audit" && (
            <div className="workbench-grid">
              {payload.audit.findings.slice(0, 6).map((finding) => (
                <article className="list-item" key={finding.id}>
                  <div className="pill-row">
                    <span className={`status ${finding.status}`}>{finding.status}</span>
                    <span className={`status ${finding.risk}`}>{finding.risk}</span>
                  </div>
                  <h3>{finding.area}</h3>
                  <p>{finding.finding}</p>
                  <span className="mini">{finding.control}</span>
                </article>
              ))}
            </div>
          )}

          {activeTab === "FinOps" && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Obligations</th>
                    <th>Rows</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.finops.topRecipients.map((recipient) => (
                    <tr key={recipient.name}>
                      <td>{recipient.name}</td>
                      <td>{dollars(recipient.value)}</td>
                      <td>{numberCompact(recipient.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
