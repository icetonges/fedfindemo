import { BookOpenCheck, FileSpreadsheet, LibraryBig, Sigma } from "lucide-react";
import { BarPanel } from "@/components/charts";
import { MetricCard } from "@/components/metric-card";
import { BudgetQueryExplorer } from "@/components/budget-query-explorer";
import { getLocalDataSnapshot, money, numberCompact } from "@/lib/source-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BudgetLabPage() {
  const data = await getLocalDataSnapshot();
  const xlsx = data.sources.filter((source) => source.extension === "xlsx");
  const bookChart = data.budgetInsights.byScenario.slice(0, 10).map((item) => ({ name: item.name.slice(0, 28), value: item.value }));

  return (
    <div className="page">
      <header className="page-header">
        <div className="header-copy">
          <p className="eyebrow">Budget Lab</p>
          <h1>Fiscal-year comparisons, budget-book extraction, and formulation analytics.</h1>
          <p>The first pass reads structured DoD JSON and inventories the PDF/XLSX corpus so later extraction can move into normalized Neon budget tables.</p>
        </div>
      </header>

      <section className="grid cols-4">
        <MetricCard icon={BookOpenCheck} label="Budget lines parsed" value={numberCompact(data.budgetInsights.totalLineObservations)} detail="Excel exhibit rows are normalized by account, activity, fiscal year, and scenario." />
        <MetricCard icon={LibraryBig} label="FY2026 total" value={money(data.budgetInsights.fy2026Total)} detail="Total/request/enacted/spend-plan columns are treated as dollars in thousands." />
        <MetricCard icon={FileSpreadsheet} label="FY2027 total/request" value={money(data.budgetInsights.fy2027Total)} detail={`${xlsx.length} spreadsheets are read directly from the local folder.`} />
        <MetricCard icon={Sigma} label="Largest variance" value={money(data.budgetInsights.yearOverYear[0]?.delta ?? 0)} detail={data.budgetInsights.yearOverYear[0]?.accountTitle ?? "No FY variance available"} />
      </section>

      <section className="grid cols-2">
        <BarPanel title="Budget amount by FY/scenario" data={bookChart} />
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>FY2026</th>
                <th>FY2027</th>
                <th>Delta</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {data.budgetInsights.yearOverYear.map((item) => (
                <tr key={item.accountTitle}>
                  <td>{item.accountTitle}</td>
                  <td>{money(item.fy2026)}</td>
                  <td>{money(item.fy2027)}</td>
                  <td>{money(item.delta)}</td>
                  <td>{Math.round(item.percent * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Largest Program Lines</h2>
          <span className="pill">{data.budgetInsights.totalLineObservations.toLocaleString()} parsed observations</span>
        </div>
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Program</th>
                <th>Account</th>
                <th>FY</th>
                <th>Scenario</th>
                <th>Amount</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {data.budgetInsights.largestLines.slice(0, 20).map((line) => (
                <tr key={line.id}>
                  <td>{line.programTitle}</td>
                  <td>{line.accountTitle}</td>
                  <td>{line.fiscalYear}</td>
                  <td>{line.scenario}</td>
                  <td>{money(line.amount)}</td>
                  <td>{line.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <BudgetQueryExplorer />
    </div>
  );
}
