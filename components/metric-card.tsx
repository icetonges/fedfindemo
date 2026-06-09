import type { LucideIcon } from "lucide-react";

export function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: LucideIcon }) {
  return (
    <div className="card metric">
      <div className="metric-top">
        <div>
          <div className="metric-value">{value}</div>
          <div className="metric-label">{label}</div>
        </div>
        <div className="metric-icon" aria-hidden="true"><Icon size={18} /></div>
      </div>
      <p className="mini">{detail}</p>
    </div>
  );
}
