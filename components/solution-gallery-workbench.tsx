"use client";

import { useMemo, useState } from "react";
import { Bot, Brain, FileText, GitBranch, LineChart, Play, ShieldCheck } from "lucide-react";

type SourceCandidate = {
  id: string;
  name: string;
  relativePath: string;
  domain: string;
  extension: string;
  fiscalYear: string;
  status: string;
  bytes: number;
};

type SolutionDefinition = {
  id: string;
  title: string;
  category: string;
  summary: string;
  defaultModel: string;
  targetOptions: readonly string[];
};

type ModelDefinition = { id: string; label: string; family: string };

type AnalysisPayload = {
  solution: SolutionDefinition;
  model: ModelDefinition;
  target: string;
  horizon: string;
  summary: string;
  diagnostics: { trainingRows: number; sourceCount: number; confidence: number; backtest: string; lift: string };
  drivers: Array<{ name: string; value: number; direction: string }>;
  outputs: Array<{ entity: string; score: number; value: string; evidence: string; action: string }>;
  recommendations: string[];
};

const iconMap = {
  "budget-analyst": Bot,
  "ml-anomaly-detection": Brain,
  "audit-readiness-assistant": ShieldCheck,
  "finops-cockpit": LineChart,
  "document-intelligence": FileText,
  "data-lineage-view": GitBranch
};

function bytes(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function SolutionGalleryWorkbench({ solutions, models, sources }: { solutions: readonly SolutionDefinition[]; models: readonly ModelDefinition[]; sources: SourceCandidate[] }) {
  const [solutionId, setSolutionId] = useState(solutions[0]?.id ?? "");
  const activeSolution = solutions.find((solution) => solution.id === solutionId) ?? solutions[0];
  const [modelId, setModelId] = useState(activeSolution?.defaultModel ?? models[0]?.id ?? "");
  const [target, setTarget] = useState(activeSolution?.targetOptions[0] ?? "");
  const [horizon, setHorizon] = useState("Current snapshot");
  const [domain, setDomain] = useState("all");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const candidateSources = useMemo(() => {
    return sources.filter((source) => domain === "all" || source.domain === domain).slice(0, 80);
  }, [domain, sources]);

  function selectSolution(nextId: string) {
    const next = solutions.find((solution) => solution.id === nextId) ?? solutions[0];
    setSolutionId(next.id);
    setModelId(next.defaultModel);
    setTarget(next.targetOptions[0] ?? "");
    setAnalysis(null);
  }

  function toggleSource(path: string) {
    setSelectedSources((current) => current.includes(path) ? current.filter((item) => item !== path) : [...current, path].slice(0, 24));
  }

  async function runAnalysis() {
    setLoading(true);
    const response = await fetch("/api/solutions/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ solutionId, modelId, target, horizon, selectedSources })
    });
    const payload = await response.json();
    setAnalysis(payload);
    setLoading(false);
  }

  return (
    <div className="solution-workbench">
      <section className="solution-grid">
        {solutions.map((solution) => {
          const Icon = iconMap[solution.id as keyof typeof iconMap] ?? Bot;
          return (
            <button className={solution.id === solutionId ? "solution-tile active" : "solution-tile"} type="button" key={solution.id} onClick={() => selectSolution(solution.id)}>
              <span className="metric-icon"><Icon size={18} /></span>
              <strong>{solution.title}</strong>
              <span>{solution.summary}</span>
              <small>{solution.category}</small>
            </button>
          );
        })}
      </section>

      <section className="card solution-runner">
        <div className="section-head">
          <div>
            <p className="eyebrow">Analysis Launcher</p>
            <h2>{activeSolution?.title}</h2>
          </div>
          <button className="button" type="button" onClick={runAnalysis} disabled={loading}>
            <Play size={15} />
            {loading ? "Running..." : "Run solution"}
          </button>
        </div>

        <div className="control-row solution-controls">
          <select value={modelId} onChange={(event) => setModelId(event.target.value)} aria-label="Model">
            {models.map((model) => <option key={model.id} value={model.id}>{model.label}</option>)}
          </select>
          <select value={target} onChange={(event) => setTarget(event.target.value)} aria-label="Target metric">
            {(activeSolution?.targetOptions ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <select value={horizon} onChange={(event) => setHorizon(event.target.value)} aria-label="Analysis horizon">
            <option value="Current snapshot">Current snapshot</option>
            <option value="FY2026 to FY2027">FY2026 to FY2027</option>
            <option value="Next 90 days">Next 90 days</option>
            <option value="Continuous monitoring">Continuous monitoring</option>
          </select>
        </div>

        <div className="dataset-picker">
          <div className="section-head">
            <h3>Dataset Candidates</h3>
            <div className="pill-row">
              <select value={domain} onChange={(event) => setDomain(event.target.value)} aria-label="Source domain">
                <option value="all">All domains</option>
                <option value="budget">Budget</option>
                <option value="awards">Awards</option>
                <option value="document">Documents</option>
                <option value="exhibit">Exhibits</option>
              </select>
              <span className="pill">{selectedSources.length || "Auto"} selected</span>
            </div>
          </div>
          <div className="source-candidate-list">
            {candidateSources.map((source) => (
              <label className="source-candidate" key={source.relativePath}>
                <input type="checkbox" checked={selectedSources.includes(source.relativePath)} onChange={() => toggleSource(source.relativePath)} />
                <span>
                  <strong>{source.name}</strong>
                  <small>{source.domain} . {source.extension.toUpperCase()} . FY{source.fiscalYear} . {bytes(source.bytes)}B</small>
                </span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {analysis ? (
        <section className="grid cols-2">
          <div className="section">
            <div className="section-head">
              <h2>Model Run</h2>
              <span className="pill">{analysis.model.family}</span>
            </div>
            <div className="signal-grid solution-signals">
              <div className="signal-card"><span>Confidence</span><strong>{analysis.diagnostics.confidence}%</strong></div>
              <div className="signal-card"><span>Training rows</span><strong>{analysis.diagnostics.trainingRows.toLocaleString()}</strong></div>
              <div className="signal-card"><span>Sources</span><strong>{analysis.diagnostics.sourceCount}</strong></div>
              <div className="signal-card"><span>Lift</span><strong>{analysis.diagnostics.lift}</strong></div>
            </div>
            <article className="list-item">
              <h3>{analysis.target}</h3>
              <p>{analysis.summary}</p>
              <span className="mini">{analysis.diagnostics.backtest} . {analysis.horizon}</span>
            </article>
            <div className="list">
              {analysis.recommendations.map((item) => (
                <article className="list-item" key={item}>
                  <h3>Recommended action</h3>
                  <p>{item}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-head">
              <h2>Feature Impact</h2>
              <span className="pill">Explainability</span>
            </div>
            <div className="driver-list">
              {analysis.drivers.map((driver) => (
                <div className="driver-row" key={driver.name}>
                  <span>{driver.name}</span>
                  <div><span style={{ width: `${driver.value}%` }} /></div>
                  <strong>{driver.value}%</strong>
                </div>
              ))}
            </div>
            <div className="card table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Entity</th>
                    <th>Score</th>
                    <th>Value</th>
                    <th>Evidence</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.outputs.map((row) => (
                    <tr key={`${row.entity}-${row.evidence}`}>
                      <td>{row.entity}</td>
                      <td>{row.score}</td>
                      <td>{row.value}</td>
                      <td>{row.evidence}</td>
                      <td>{row.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
