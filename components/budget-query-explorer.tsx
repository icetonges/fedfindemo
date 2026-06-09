"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

type BudgetRow = {
  id: string;
  accountTitle: string;
  programTitle: string;
  fiscalYear: string;
  scenario: string;
  amount: number;
  appropriationFamily: string;
};

function dollars(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function BudgetQueryExplorer() {
  const [fiscalYear, setFiscalYear] = useState("2027");
  const [family, setFamily] = useState("");
  const [search, setSearch] = useState("");
  const [payload, setPayload] = useState<{ totalMatches: number; totalAmount: number; rows: BudgetRow[] } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ fiscalYear, limit: "40" });
    if (family) params.set("family", family);
    if (search) params.set("search", search);
    fetch(`/api/query/budget?${params.toString()}`)
      .then((response) => response.json())
      .then(setPayload)
      .catch(() => setPayload(null));
  }, [fiscalYear, family, search]);

  return (
    <section className="section">
      <div className="section-head">
        <h2>Interactive Budget Query</h2>
        <span className="pill">{payload ? `${payload.totalMatches.toLocaleString()} matches · ${dollars(payload.totalAmount)}` : "Loading"}</span>
      </div>
      <div className="card work-area">
        <div className="control-row">
          <select value={fiscalYear} onChange={(event) => setFiscalYear(event.target.value)} aria-label="Fiscal year">
            <option value="2027">FY2027</option>
            <option value="2026">FY2026</option>
            <option value="2025">FY2025</option>
          </select>
          <select value={family} onChange={(event) => setFamily(event.target.value)} aria-label="Appropriation family">
            <option value="">All appropriations</option>
            <option value="Operation & Maintenance">Operation & Maintenance</option>
            <option value="Procurement">Procurement</option>
            <option value="RDT&E">RDT&E</option>
            <option value="Military Personnel">Military Personnel</option>
            <option value="Military Construction">Military Construction</option>
          </select>
          <label className="search-box">
            <Search size={15} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search program or account" />
          </label>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Program</th>
                <th>Account</th>
                <th>FY</th>
                <th>Scenario</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(payload?.rows ?? []).map((row) => (
                <tr key={row.id}>
                  <td>{row.programTitle}</td>
                  <td>{row.accountTitle}</td>
                  <td>{row.fiscalYear}</td>
                  <td>{row.scenario}</td>
                  <td>{dollars(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
