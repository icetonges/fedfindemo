import { AlertTriangle, Database, FileText, Landmark, ReceiptText, ShieldCheck } from "lucide-react";
import { AreaPanel, BarPanel } from "@/components/charts";
import { FilteredChartPanel } from "@/components/filtered-chart-panel";
import { KnowledgePanel } from "@/components/knowledge-panel";
import { MissionControlWorkbench } from "@/components/mission-control-workbench";
import { MetricCard } from "@/components/metric-card";
import { knowledgePlaybooks } from "@/lib/knowledge-content";
import { getLocalDataSnapshot, money, numberCompact } from "@/lib/source-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const data = await getLocalDataSnapshot();
  const totalRows = data.awardInsights.totalRows;
  const totalObligations = data.awardInsights.totalObligations;
  const parsedFiles = data.sources.filter((source) => source.status === "parsed").length;

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
        <MetricCard icon={Database} label="Live source files" value={numberCompact(data.sources.length)} detail={`Folder scanned at request time; refreshed ${new Date(data.generatedAt).toLocaleTimeString()}.`} href="/insights/sources" />
        <MetricCard icon={ReceiptText} label="Award rows parsed" value={numberCompact(totalRows)} detail="Prime and subaward extracts power the FinOps baseline." href="/insights/awards" />
        <MetricCard icon={Landmark} label="Obligations profiled" value={money(totalObligations)} detail="Local USAspending files drive spend and variance analytics." href="/insights/awards" />
        <MetricCard icon={AlertTriangle} label="FY2027 request" value={money(data.budgetInsights.fy2027Request)} detail="Parsed from DoD Excel exhibit lines, not file metadata." href="/insights/budget" />
      </section>

      <MissionControlWorkbench />

      <KnowledgePanel playbook={knowledgePlaybooks.dashboard} />

      <section className="grid cols-2">
        <FilteredChartPanel title="Filtered budget slice" scope="budget" defaultFiscalYear="2027" defaultGroupBy="family" />
        <FilteredChartPanel title="Filtered award slice" scope="awards" defaultGroupBy="recipient" />
      </section>

      <section className="grid cols-2">
        <BarPanel title="Budget by appropriation family" data={data.budgetInsights.byAppropriationFamily.map((item) => ({ name: item.name, value: item.value }))} />
        <AreaPanel title="Award obligations by action month" data={data.awardInsights.byMonth.map((item) => ({ name: item.name, value: item.value }))} />
      </section>

      <section className="grid cols-2">
        <BarPanel title="Top budget accounts" data={data.budgetInsights.byAccount.slice(0, 8).map((item) => ({ name: item.name.slice(0, 28), value: item.value }))} />
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
