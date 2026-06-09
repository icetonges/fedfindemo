"use client";

import { useState } from "react";
import { Send, Sparkles } from "lucide-react";

const profiles = [
  "Budget analyst",
  "Audit readiness",
  "Anomaly triage",
  "Document intelligence",
  "Data quality"
];

export function AiChat() {
  const [profile, setProfile] = useState(profiles[0]);
  const [message, setMessage] = useState("Explain the highest-priority risks in the local source data and what should be normalized into Neon first.");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setAnswer("");
    const response = await fetch("/api/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, message })
    });
    const payload = await response.json();
    setAnswer(payload.answer ?? payload.error ?? "No response returned.");
    setLoading(false);
  }

  return (
    <div className="card split-panel">
      <aside className="rail">
        {profiles.map((item) => (
          <button className={`button ${profile === item ? "" : "secondary"}`} key={item} onClick={() => setProfile(item)} type="button">
            <Sparkles size={15} />
            {item}
          </button>
        ))}
      </aside>
      <div className="work-area">
        <div className="section">
          <h2>{profile}</h2>
          <textarea className="textarea" value={message} onChange={(event) => setMessage(event.target.value)} />
          <button className="button" onClick={submit} disabled={loading} type="button">
            <Send size={15} />
            {loading ? "Analyzing..." : "Run analyst"}
          </button>
          {answer ? (
            <article className="list-item">
              <h3>Source-grounded response</h3>
              <p>{answer}</p>
            </article>
          ) : null}
        </div>
      </div>
    </div>
  );
}
