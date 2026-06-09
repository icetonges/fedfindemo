"use client";

import { useState } from "react";
import { GitCompare, Send, Sparkles } from "lucide-react";

const profiles = ["Budget analyst", "Audit readiness", "Anomaly triage", "Document intelligence", "Data quality", "Executive briefer"];
const focuses = ["Enterprise", "Budget", "Awards", "Audit", "Source lineage", "Neon migration"];
const models = [
  { value: "auto", label: "Auto fallback" },
  { value: "google", label: "Gemini" },
  { value: "anthropic", label: "Claude" },
  { value: "groq", label: "Llama" },
  { value: "local", label: "Local analyst" }
];

type AiResult = { model: string; label: string; answer: string };

export function AiChat() {
  const [profile, setProfile] = useState(profiles[0]);
  const [focus, setFocus] = useState(focuses[0]);
  const [modelA, setModelA] = useState("auto");
  const [modelB, setModelB] = useState("local");
  const [compare, setCompare] = useState(true);
  const [message, setMessage] = useState("Build a decision-grade analysis of the most important budget, award, audit, and source-lineage risks. Include quantified drivers and recommended next actions.");
  const [results, setResults] = useState<AiResult[]>([]);
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setResults([]);
    setWarning("");
    const response = await fetch("/api/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, focus, modelA, modelB, compare, message })
    });
    const payload = await response.json();
    setResults(payload.results ?? []);
    setWarning(payload.warning ?? payload.error ?? "");
    setLoading(false);
  }

  return (
    <div className="card ai-workbench">
      <aside className="rail ai-rail">
        <div className="section">
          <h2>Profiles</h2>
          {profiles.map((item) => (
            <button className={`button ${profile === item ? "" : "secondary"}`} key={item} onClick={() => setProfile(item)} type="button">
              <Sparkles size={15} />
              {item}
            </button>
          ))}
        </div>
        <div className="section">
          <h2>Dataset Focus</h2>
          <select value={focus} onChange={(event) => setFocus(event.target.value)} aria-label="Dataset focus">
            {focuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </aside>
      <div className="work-area ai-main">
        <div className="control-row ai-controls">
          <select value={modelA} onChange={(event) => setModelA(event.target.value)} aria-label="Model A">
            {models.map((model) => <option key={model.value} value={model.value}>Model A: {model.label}</option>)}
          </select>
          <select value={modelB} onChange={(event) => setModelB(event.target.value)} aria-label="Model B">
            {models.map((model) => <option key={model.value} value={model.value}>Model B: {model.label}</option>)}
          </select>
          <label className="toggle-line">
            <input type="checkbox" checked={compare} onChange={(event) => setCompare(event.target.checked)} />
            <GitCompare size={15} />
            Compare outputs
          </label>
        </div>
        <textarea className="textarea analyst-textarea" value={message} onChange={(event) => setMessage(event.target.value)} />
        <button className="button" onClick={submit} disabled={loading} type="button">
          <Send size={15} />
          {loading ? "Running analysis..." : compare ? "Run model comparison" : "Run analyst"}
        </button>
        {warning ? <p className="mini">{warning}</p> : null}
        <div className={compare ? "ai-results compare-results" : "ai-results"}>
          {results.map((result) => (
            <article className="list-item ai-output" key={`${result.model}-${result.label}`}>
              <div className="pill-row">
                <span className="status ready">{result.label}</span>
                <span className="mini">{profile} . {focus}</span>
              </div>
              <pre>{result.answer}</pre>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
