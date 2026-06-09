import { AlertOctagon, BadgeDollarSign, Building2, Receipt } from "lucide-react";
import { BarPanel } from "@/components/charts";
import { MetricCard } from "@/components/metric-card";
import { getLocalDataSnapshot, money, numberCompact } from "@/lib/source-data";

function mergeCounts(items: Array<Record<string, number>>, take = 8) {
  const merged: Record<string, number> = {};
  items.forEach((record) => {
    Object.entries(record).forEach(([key, value]) => {
      merged[key] = (merged[key] ?? 0) + value;
    });
  });
  return Object.entries(merged).sort((a, b) => b[1] - a[1]).slice(0, take).map(([name, value]) => ({
    name: name.length > 24 ? `${name.slice(0, 22)}...` : name,
    value
  }));
}

export default function FinOpsMonitorPage() {
  const data = getLocalDataSnapshot();
  const rows = data.awards.reduce((sum, award) => sum + award.rows, 0);
  const obligations = data.awards.reduce((sum, award) => sum + award.totalObligation, 0);
  const negative = data.awards.reduce((sum, award) => sum + award.negativeActions, 0);
  const vendors = mergeCounts(data.awards.map((award) => award.recipients));
  const agencies = mergeCounts(data.awards.map((award) => award.agencies));

  return (
    <div className="page">
      <header className="page-header">
        <div className="header-copy">
          <p className="eyebrow">FinOps Monitor</p>
          <h1>Obligations, vendors, transactions, burn-rate proxies, and anomaly triage.</h1>
          <p>USAspending prime and subaward CSVs provide the current operational baseline for award analytics and exception queues.</p>
        </div>
      </header>

      <section className="grid cols-4">
        <MetricCard icon={Receipt} label="Transactions and subawards" value={numberCompact(rows)} detail="Rows parsed from local USAspending award extracts." />
        <MetricCard icon={BadgeDollarSign} label="Total obligation signal" value={money(obligations)} detail="Federal action and award amount fields normalized into one profile." />
        <MetricCard icon={Building2} label="Top vendor count" value={numberCompact(vendors[0]?.value ?? 0)} detail={vendors[0]?.name ?? "No named vendor found"} />
        <MetricCard icon={AlertOctagon} label="Negative actions" value={numberCompact(negative)} detail="Potential deobligations or corrections queued for variance analysis." />
      </section>

      <section className="grid cols-2">
        <BarPanel title="Most frequent award counterparties" data={vendors} />
        <BarPanel title="Awarding and funding agency mentions" data={agencies} />
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Anomaly Queue</h2>
          <span className="pill">{data.anomalies.length} risk signals</span>
        </div>
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Severity</th>
                <th>Category</th>
                <th>Signal</th>
                <th>Detail</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {data.anomalies.map((anomaly) => (
                <tr key={anomaly.id}>
                  <td><span className={`status ${anomaly.severity}`}>{anomaly.severity}</span></td>
                  <td>{anomaly.category}</td>
                  <td>{anomaly.title}</td>
                  <td>{anomaly.detail}</td>
                  <td>{anomaly.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
