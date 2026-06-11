"use client";

import { useMemo, useRef, useState } from "react";
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
  executiveSummary: string;
  sourceBrief: Array<{ name: string; path: string; domain: string; type: string; fiscalYear: string; status: string; role: string }>;
  sourceCoverage: Array<{ source: string; domain: string; status: string; rowsEvaluated: number; amount: string; evidenceSignal: string }>;
  modelMethodology: string[];
  actionItems: Array<{ priority: string; owner: string; action: string; evidenceNeeded: string }>;
  keyFindings: string[];
  riskRegister: string[];
  corpusProfile: {
    rowsEvaluated: number;
    sourceCount: number;
    entityCount: number;
    selectedSourceCount: number;
    totalSignal: string;
    outputRowsDisplayed: number;
    wholeCorpusStatement: string;
  };
  persistence?: { persisted: boolean; id?: number; reason?: string };
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
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLDivElement | null>(null);

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
    setError("");
    try {
      const response = await fetch("/api/solutions/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solutionId, modelId, target, horizon, selectedSources })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "The solution analysis request failed.");
      setAnalysis(payload);
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (caught) {
      setAnalysis(null);
      setError(caught instanceof Error ? caught.message : "The solution analysis request failed.");
    } finally {
      setLoading(false);
    }
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

        {error ? (
          <article className="list-item result-preview error-preview">
            <h3>Analysis did not run</h3>
            <p>{error}</p>
          </article>
        ) : null}

        {analysis ? (
          <article className="list-item result-preview">
            <div className="pill-row">
              <span className="status ready">Generated</span>
              <span className="mini">{analysis.model.label} . {analysis.target}</span>
            </div>
            <h3>{analysis.solution.title}</h3>
            <p>{analysis.summary}</p>
            <div className="pill-row">
              <span className="pill">Confidence {analysis.diagnostics.confidence}%</span>
              <span className="pill">{analysis.corpusProfile.rowsEvaluated.toLocaleString()} rows reviewed</span>
              <span className="pill">{analysis.diagnostics.sourceCount} sources</span>
            </div>
          </article>
        ) : null}

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
        <section className="analysis-panel report-flow" ref={resultRef}>
          <div className="section-head">
            <div>
              <p className="eyebrow">Model Run Report</p>
              <h2>{analysis.solution.title}</h2>
              <p>{analysis.model.label} . {analysis.model.family} . {analysis.target}</p>
            </div>
            <span className="pill">{analysis.horizon}</span>
          </div>

          <article className="card report-block">
            <h2>Executive Summary</h2>
            <p>{analysis.executiveSummary}</p>
            <p>{analysis.corpusProfile.wholeCorpusStatement}</p>
            <div className="pill-row">
              <span className="pill">Total signal {analysis.corpusProfile.totalSignal}</span>
              <span className="pill">{analysis.corpusProfile.entityCount.toLocaleString()} entities</span>
              <span className="pill">{analysis.persistence?.persisted ? `Saved run #${analysis.persistence.id}` : "Local run not persisted"}</span>
            </div>
          </article>

          <div className="signal-grid solution-signals">
            <div className="signal-card"><span>Confidence</span><strong>{analysis.diagnostics.confidence}%</strong></div>
            <div className="signal-card"><span>Rows analyzed</span><strong>{analysis.diagnostics.trainingRows.toLocaleString()}</strong></div>
            <div className="signal-card"><span>Sources used</span><strong>{analysis.diagnostics.sourceCount}</strong></div>
            <div className="signal-card"><span>Validation signal</span><strong>{analysis.diagnostics.lift}</strong></div>
          </div>

          <section className="card report-block">
            <div className="section-head">
              <h2>How The Model Works On The Selected Documents</h2>
              <span className="pill">{analysis.diagnostics.backtest}</span>
            </div>
            <div className="knowledge-grid">
              <article className="knowledge-section">
                <h3>Model method</h3>
                <ul>
                  {analysis.modelMethodology.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </article>
              <article className="knowledge-section">
                <h3>Document/source set interpreted</h3>
                <ul>
                  {analysis.sourceBrief.map((source) => (
                    <li key={source.path}>{source.name}: {source.role}; {source.domain}/{source.type}; FY{source.fiscalYear}; {source.status}.</li>
                  ))}
                </ul>
              </article>
            </div>
          </section>

          <section className="card report-block">
            <div className="section-head">
              <h2>Expert Findings And Risk Register</h2>
              <span className="pill">Federal financial management readout</span>
            </div>
            <div className="knowledge-grid">
              <article className="knowledge-section">
                <h3>Key findings</h3>
                <ul>
                  {analysis.keyFindings.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </article>
              <article className="knowledge-section">
                <h3>Risk register</h3>
                <ul>
                  {analysis.riskRegister.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </article>
            </div>
          </section>

          <section className="card report-block">
            <div className="section-head">
              <h2>Detailed Analysis Results</h2>
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
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Entity</th>
                    <th>Score</th>
                    <th>Value</th>
                    <th>Evidence</th>
                    <th>Model action</th>
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
          </section>

          <section className="card report-block">
            <div className="section-head">
              <h2>Source Coverage</h2>
              <span className="pill">Whole-document/corpus check</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Domain</th>
                    <th>Status</th>
                    <th>Rows/Page Signals</th>
                    <th>Amount</th>
                    <th>Evidence signal</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.sourceCoverage.map((source) => (
                    <tr key={source.source}>
                      <td>{source.source}</td>
                      <td>{source.domain}</td>
                      <td>{source.status}</td>
                      <td>{source.rowsEvaluated.toLocaleString()}</td>
                      <td>{source.amount}</td>
                      <td>{source.evidenceSignal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card report-block">
            <div className="section-head">
              <h2>Action Items</h2>
              <span className="pill">{analysis.actionItems.length} actions</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Priority</th>
                    <th>Owner</th>
                    <th>Action</th>
                    <th>Evidence needed</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.actionItems.map((item) => (
                    <tr key={`${item.priority}-${item.action}`}>
                      <td><span className={`status ${item.priority === "High" ? "high" : item.priority === "Medium" ? "medium" : "watch"}`}>{item.priority}</span></td>
                      <td>{item.owner}</td>
                      <td>{item.action}</td>
                      <td>{item.evidenceNeeded}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      ) : null}
    </div>
  );
}
