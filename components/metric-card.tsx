import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export function MetricCard({ label, value, detail, icon: Icon, href }: { label: string; value: string; detail: string; icon: LucideIcon; href?: string }) {
  const content = (
    <>
      <div className="metric-top">
        <div>
          <div className="metric-value">{value}</div>
          <div className="metric-label">{label}</div>
        </div>
        <div className="metric-icon" aria-hidden="true"><Icon size={18} /></div>
      </div>
      <p className="mini">{detail}</p>
    </>
  );

  if (href) {
    return (
      <Link className="card metric metric-link" href={href}>
        {content}
      </Link>
    );
  }

  return (
    <div className="card metric">
      {content}
    </div>
  );
}
