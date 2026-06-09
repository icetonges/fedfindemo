"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

type AwardRow = {
  id: string;
  awardId: string;
  recipient: string;
  subAgency: string;
  fiscalYear: string;
  obligation: number;
  naics: string;
  state: string;
};

function dollars(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function AwardQueryExplorer() {
  const [awardType, setAwardType] = useState("");
  const [state, setState] = useState("");
  const [search, setSearch] = useState("");
  const [payload, setPayload] = useState<{ totalMatches: number; totalObligations: number; rows: AwardRow[] } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ limit: "40" });
    if (awardType) params.set("awardType", awardType);
    if (state) params.set("state", state);
    if (search) params.set("search", search);
    fetch(`/api/query/awards?${params.toString()}`)
      .then((response) => response.json())
      .then(setPayload)
      .catch(() => setPayload(null));
  }, [awardType, state, search]);

  return (
    <section className="section">
      <div className="section-head">
        <h2>Interactive Award Query</h2>
        <span className="pill">{payload ? `${payload.totalMatches.toLocaleString()} matches . ${dollars(payload.totalObligations)}` : "Loading"}</span>
      </div>
      <div className="card work-area">
        <div className="control-row">
          <select value={awardType} onChange={(event) => setAwardType(event.target.value)} aria-label="Award type">
            <option value="">All award types</option>
            <option value="contract">Contracts</option>
            <option value="assistance">Assistance</option>
          </select>
          <select value={state} onChange={(event) => setState(event.target.value)} aria-label="State">
            <option value="">All states</option>
            <option value="Virginia">Virginia</option>
            <option value="California">California</option>
            <option value="Texas">Texas</option>
            <option value="Maryland">Maryland</option>
            <option value="Massachusetts">Massachusetts</option>
          </select>
          <label className="search-box">
            <Search size={15} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search recipient, NAICS, or object class" />
          </label>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Award</th>
                <th>Recipient</th>
                <th>Agency</th>
                <th>FY</th>
                <th>Obligation</th>
                <th>Program</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {(payload?.rows ?? []).map((row) => (
                <tr key={row.id}>
                  <td>{row.awardId}</td>
                  <td>{row.recipient}</td>
                  <td>{row.subAgency}</td>
                  <td>{row.fiscalYear}</td>
                  <td>{dollars(row.obligation)}</td>
                  <td>{row.naics}</td>
                  <td>{row.state}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
