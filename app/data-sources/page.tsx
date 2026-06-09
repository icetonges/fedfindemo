import { CheckCircle2, CloudCog, Database, RefreshCw } from "lucide-react";
import { BarPanel } from "@/components/charts";
import { MetricCard } from "@/components/metric-card";
import { getLocalDataSnapshot, numberCompact } from "@/lib/source-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DataSourcesPage() {
  const data = await getLocalDataSnapshot();
  const parsed = data.sources.filter((source) => source.status === "parsed").length;
  const byFolder = Object.entries(data.sources.reduce<Record<string, number>>((acc, source) => {
    acc[source.folder.split("/")[0] || "sourcedata"] = (acc[source.folder.split("/")[0] || "sourcedata"] ?? 0) + 1;
    return acc;
  }, {})).map(([name, value]) => ({ name, value }));

  return (
    <div className="page">
      <header className="page-header">
        <div className="header-copy">
          <p className="eyebrow">Data Sources</p>
          <h1>Local inventory, cloud sync readiness, scraping status, and provenance.</h1>
          <p>Every record in this prototype starts with a repository-local file path before moving to Neon and scheduled public-source refresh jobs.</p>
        </div>
      </header>

      <section className="grid cols-4">
        <MetricCard icon={Database} label="Total files" value={numberCompact(data.sources.length)} detail="Complete inventory across the sourcedata tree." />
        <MetricCard icon={CheckCircle2} label="Parsed files" value={numberCompact(parsed)} detail="CSV and JSON files currently feed typed API responses." />
        <MetricCard icon={CloudCog} label="Neon sync" value="Ready" detail="Schema is defined without requiring a local cloud connection." />
        <MetricCard icon={RefreshCw} label="Runtime refresh" value="Live" detail="The app checks file path, size, and modified time on each request." />
      </section>

      <section className="grid cols-2">
        <BarPanel title="Source files by source family" data={byFolder} />
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Type</th>
                <th>Domain</th>
                <th>FY</th>
                <th>Modified</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.sources.map((source) => (
                <tr key={source.id}>
                  <td>{source.relativePath}</td>
                  <td>{source.extension.toUpperCase()}</td>
                  <td>{source.domain}</td>
                  <td>{source.fiscalYear}</td>
                  <td>{new Date(source.lastModified).toLocaleString()}</td>
                  <td><span className={`status ${source.status === "parsed" ? "ready" : "monitoring"}`}>{source.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
