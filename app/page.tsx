import { AlertTriangle, Database, FileText, Landmark, ReceiptText, ShieldCheck } from "lucide-react";
import { AreaPanel, BarPanel } from "@/components/charts";
import { MetricCard } from "@/components/metric-card";
import { getLocalDataSnapshot, money, numberCompact } from "@/lib/source-data";

function topRecords(records: Record<string, number>, take = 6) {
  return Object.entries(records)
    .sort((a, b) => b[1] - a[1])
    .slice(0, take)
    .map(([name, value]) => ({ name: name.length > 26 ? `${name.slice(0, 24)}...` : name, value }));
}

export default function DashboardPage() {
  const data = getLocalDataSnapshot();
  const totalRows = data.awards.reduce((sum, award) => sum + award.rows, 0);
  const totalObligations = data.awards.reduce((sum, award) => sum + award.totalObligation, 0);
  const parsedFiles = data.sources.filter((source) => source.status === "parsed").length;
  const fyCounts = data.sources.reduce<Record<string, number>>((acc, source) => {
    acc[source.fiscalYear] = (acc[source.fiscalYear] ?? 0) + 1;
    return acc;
  }, {});
  const awardMix = data.awards.map((award) => ({
    name: `${award.awardType} ${award.tier}`,
    value: award.rows
  }));
  const sourceMix = Object.entries(data.sources.reduce<Record<string, number>>((acc, source) => {
    acc[source.extension] = (acc[source.extension] ?? 0) + 1;
    return acc;
  }, {})).map(([name, value]) => ({ name, value }));

  return (
    <div className="page">
      <header className="page-header">
        <div className="header-copy">
          <p className="eyebrow">Local-first federal finance intelligence</p>
          <h1>Operational portal for budget, audit, and financial management workflows.</h1>
          <p>Built from the local USAspending extracts, DoD budget JSON, budget PDFs, and spreadsheet exhibits already saved in the repository.</p>
        </div>
        <div className="pill-row">
          <span className="pill"><Database size={14} /> {data.sources.length} local files</span>
          <span className="pill"><FileText size={14} /> {parsedFiles} parsed sources</span>
        </div>
      </header>

      <section className="grid cols-4">
        <MetricCard icon={Database} label="Source files inventoried" value={numberCompact(data.sources.length)} detail="CSV, JSON, PDF, and XLSX files carry provenance metadata." />
        <MetricCard icon={ReceiptText} label="Award rows parsed" value={numberCompact(totalRows)} detail="Prime and subaward extracts power the FinOps baseline." />
        <MetricCard icon={Landmark} label="Obligations profiled" value={money(totalObligations)} detail="Local USAspending files drive spend and variance analytics." />
        <MetricCard icon={AlertTriangle} label="Risk signals" value={numberCompact(data.anomalies.length)} detail="Derived from reversals, missing counterparties, and extraction gaps." />
      </section>

      <section className="grid cols-2">
        <BarPanel title="Source inventory by file type" data={sourceMix} />
        <AreaPanel title="Source files by fiscal year" data={topRecords(fyCounts, 8)} />
      </section>

      <section className="grid cols-2">
        <BarPanel title="Award coverage by extract" data={awardMix} />
        <div className="section">
          <div className="section-head">
            <h2>Intelligence Feed</h2>
            <span className="pill"><ShieldCheck size={14} /> Source-grounded</span>
          </div>
          <div className="list">
            {data.intelligenceItems.map((item) => (
              <article className="list-item" key={item.id}>
                <div className="pill-row">
                  <span className={`status ${item.priority}`}>{item.priority}</span>
                  <span className="mini">{item.category}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <span className="mini">{item.source}</span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
