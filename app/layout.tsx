import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Bot, Database, FileCheck2, GalleryHorizontalEnd, Gauge, Landmark, LineChart, ShieldCheck } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Federal Financial Management Demo",
  description: "Local-first federal budget, audit, and financial operations intelligence prototype."
};

const navItems = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/budget-lab", label: "Budget Lab", icon: BarChart3 },
  { href: "/audit-readiness", label: "Audit Readiness", icon: ShieldCheck },
  { href: "/finops-monitor", label: "FinOps Monitor", icon: LineChart },
  { href: "/ai-analyst", label: "AI Analyst", icon: Bot },
  { href: "/data-sources", label: "Data Sources", icon: Database },
  { href: "/solution-gallery", label: "Solution Gallery", icon: GalleryHorizontalEnd }
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <Link href="/" className="brand" aria-label="Federal Financial Management Demo home">
              <span className="brand-icon"><Landmark size={20} /></span>
              <span>
                <strong>FedFin Demo</strong>
                <small>Budget, audit, operations</small>
              </span>
            </Link>
            <nav className="nav-list" aria-label="Primary navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link href={item.href} className="nav-link" key={item.href}>
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="sidebar-note">
              <FileCheck2 size={16} />
              <span>Local source data is the active system of record.</span>
            </div>
          </aside>
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}
