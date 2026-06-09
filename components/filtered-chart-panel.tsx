"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, RefreshCw } from "lucide-react";
import { BarPanel } from "./charts";

type Scope = "budget" | "awards" | "sources";

type ChartPayload = {
  generatedAt: string;
  chart: Array<{ name: string; value: number; count: number }>;
  sources: string[];
};

const groups: Record<Scope, Array<{ value: string; label: string }>> = {
  budget: [
    { value: "family", label: "Appropriation" },
    { value: "account", label: "Account" },
    { value: "scenario", label: "Scenario" },
    { value: "activity", label: "Activity" }
  ],
  awards: [
    { value: "recipient", label: "Recipient" },
    { value: "agency", label: "Agency" },
    { value: "state", label: "State" },
    { value: "month", label: "Action month" }
  ],
  sources: [
    { value: "folder", label: "Folder" },
    { value: "domain", label: "Domain" },
    { value: "type", label: "Type" }
  ]
};

export function FilteredChartPanel({ title, scope, defaultFiscalYear = "", defaultGroupBy }: { title: string; scope: Scope; defaultFiscalYear?: string; defaultGroupBy: string }) {
  const [groupBy, setGroupBy] = useState(defaultGroupBy);
  const [fiscalYear, setFiscalYear] = useState(defaultFiscalYear);
  const [source, setSource] = useState("");
  const [payload, setPayload] = useState<ChartPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams({ scope, groupBy });
    if (fiscalYear) params.set("fiscalYear", fiscalYear);
    if (source) params.set("source", source);
    return params.toString();
  }, [scope, groupBy, fiscalYear, source]);

  useEffect(() => {
    fetch(`/api/charts?${query}`)
      .then((response) => response.json())
      .then(setPayload)
      .catch(() => setPayload(null))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        <span className="pill">{loading ? <RefreshCw size={14} className="spin" /> : <Filter size={14} />} {payload ? `${payload.chart.length} groups` : "Loading"}</span>
      </div>
      <div className="filter-panel">
        <div className="control-row chart-controls">
          <select value={groupBy} onChange={(event) => { setLoading(true); setGroupBy(event.target.value); }} aria-label="Chart grouping">
            {groups[scope].map((group) => <option key={group.value} value={group.value}>{group.label}</option>)}
          </select>
          {scope !== "sources" ? (
            <select value={fiscalYear} onChange={(event) => { setLoading(true); setFiscalYear(event.target.value); }} aria-label="Fiscal year">
              <option value="">All fiscal years</option>
              <option value="2027">FY2027</option>
              <option value="2026">FY2026</option>
              <option value="2025">FY2025</option>
            </select>
          ) : <span className="pill">Inventory view</span>}
          <select value={source} onChange={(event) => { setLoading(true); setSource(event.target.value); }} aria-label="Source document">
            <option value="">All source documents</option>
            {(payload?.sources ?? []).map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <BarPanel title={`${title}: ${groups[scope].find((group) => group.value === groupBy)?.label ?? groupBy}`} data={(payload?.chart ?? []).map((item) => ({ name: item.name.slice(0, 30), value: item.value }))} />
      </div>
    </section>
  );
}
