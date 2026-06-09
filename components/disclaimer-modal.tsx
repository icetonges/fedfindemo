"use client";

import { ShieldCheck, X } from "lucide-react";
import { useState } from "react";

export function DisclaimerModal() {
  const [open, setOpen] = useState(() => (typeof window === "undefined" ? false : window.localStorage.getItem("fedfin-disclaimer-ack") !== "1"));

  function acknowledge() {
    window.localStorage.setItem("fedfin-disclaimer-ack", "1");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="disclaimer-title">
        <button className="icon-button modal-close" type="button" onClick={acknowledge} aria-label="Close disclaimer" title="Close">
          <X size={18} />
        </button>
        <div className="modal-icon"><ShieldCheck size={20} /></div>
        <h2 id="disclaimer-title">Federal finance demo notice</h2>
        <p>
          This application is a source-grounded prototype built from local files in the repository. It is not an official federal system,
          budget certification tool, audit opinion, or procurement system of record.
        </p>
        <p>
          Use the dashboards to inspect parsed evidence, data quality, and workflow concepts before connecting production databases,
          identity, approvals, or live agency ingestion.
        </p>
        <button className="button" type="button" onClick={acknowledge}>Continue</button>
      </section>
    </div>
  );
}
