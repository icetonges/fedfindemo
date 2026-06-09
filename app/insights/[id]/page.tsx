import Link from "next/link";
import { ArrowLeft, Database } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { getInsightPayload } from "@/lib/insights";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InsightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const insight = await getInsightPayload(id);

  return (
    <div className="page">
      <header className="page-header">
        <div className="header-copy">
          <Link href="/" className="back-link"><ArrowLeft size={16} /> Dashboard</Link>
          <p className="eyebrow">{insight.eyebrow}</p>
          <h1>{insight.title}</h1>
          <p>{insight.summary}</p>
        </div>
      </header>

      <section className="grid cols-3">
        {insight.metrics.map((metric) => (
          <MetricCard icon={Database} key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} />
        ))}
      </section>

      <section className="grid cols-2">
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                {Object.keys(insight.rows[0] ?? { Detail: "" }).map((key) => <th key={key}>{key}</th>)}
              </tr>
            </thead>
            <tbody>
              {insight.rows.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((value, cell) => <td key={`${index}-${cell}`}>{value}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="section">
          <div className="section-head">
            <h2>Evidence Sources</h2>
            <span className="pill">{insight.sources.length} shown</span>
          </div>
          <div className="list">
            {insight.sources.map((source) => (
              <article className="list-item" key={source}>
                <h3>{source}</h3>
                <p>Included in this drilldown through parsed source provenance.</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
