import { AlertOctagon, BadgeDollarSign, Building2, Receipt } from "lucide-react";
import { BarPanel } from "@/components/charts";
import { AwardQueryExplorer } from "@/components/award-query-explorer";
import { MetricCard } from "@/components/metric-card";
import { getLocalDataSnapshot, money, numberCompact } from "@/lib/source-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FinOpsMonitorPage() {
  const data = await getLocalDataSnapshot();
  const rows = data.awardInsights.totalRows;
  const obligations = data.awardInsights.totalObligations;
  const negative = data.awardInsights.negativeObligations;
  const vendors = data.awardInsights.byRecipient.map((item) => ({ name: item.name.slice(0, 24), value: item.value }));
  const programs = data.awardInsights.byNaics.map((item) => ({ name: item.name.slice(0, 24), value: item.value }));

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
        <MetricCard icon={Building2} label="Top recipient obligation" value={money(data.awardInsights.byRecipient[0]?.value ?? 0)} detail={data.awardInsights.byRecipient[0]?.name ?? "No named vendor found"} />
        <MetricCard icon={AlertOctagon} label="Negative actions" value={numberCompact(negative)} detail="Potential deobligations or corrections queued for variance analysis." />
      </section>

      <section className="grid cols-2">
        <BarPanel title="Most frequent award counterparties" data={vendors} />
        <BarPanel title="Award obligations by NAICS/program" data={programs} />
      </section>

      <section className="grid cols-2">
        <BarPanel title="Object class obligations" data={data.awardInsights.byObjectClass.map((item) => ({ name: item.name.slice(0, 26), value: item.value }))} />
        <BarPanel title="Place of performance" data={data.awardInsights.byState.map((item) => ({ name: item.name.slice(0, 26), value: item.value }))} />
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

      <section className="section">
        <div className="section-head">
          <h2>Largest Award Actions</h2>
          <span className="pill">{data.awardTransactions.length} high-value records</span>
        </div>
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Award</th>
                <th>Recipient</th>
                <th>Agency</th>
                <th>FY</th>
                <th>Obligation</th>
                <th>Program / NAICS</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {data.awardTransactions.slice(0, 24).map((award) => (
                <tr key={award.id}>
                  <td>{award.awardId}</td>
                  <td>{award.recipient}</td>
                  <td>{award.subAgency || award.agency}</td>
                  <td>{award.fiscalYear}</td>
                  <td>{money(award.obligation)}</td>
                  <td>{award.naics}</td>
                  <td>{award.description || award.productOrService}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AwardQueryExplorer />
    </div>
  );
}
