import { BrainCircuit, DatabaseZap, MessagesSquare } from "lucide-react";
import { AiChat } from "@/components/ai-chat";
import { KnowledgePanel } from "@/components/knowledge-panel";
import { MetricCard } from "@/components/metric-card";
import { knowledgePlaybooks } from "@/lib/knowledge-content";
import { getLocalDataSnapshot, numberCompact } from "@/lib/source-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AiAnalystPage() {
  const data = await getLocalDataSnapshot();
  return (
    <div className="page">
      <header className="page-header">
        <div className="header-copy">
          <p className="eyebrow">AI Analyst</p>
          <h1>Model-comparison analyst workbench for budget, audit, and financial operations.</h1>
          <p>Run task-profiled analysis against local source evidence, choose the model path, and compare two model outputs side by side.</p>
        </div>
      </header>

      <section className="grid cols-3">
        <MetricCard icon={DatabaseZap} label="Grounding records" value={numberCompact(data.budgetInsights.totalLineObservations + data.awardInsights.totalRows)} detail="The model receives budget lines, award summaries, audit themes, and live source provenance." />
        <MetricCard icon={BrainCircuit} label="Task profiles" value="6" detail="Budget, audit, anomaly, document, data-quality, and executive briefing modes." />
        <MetricCard icon={MessagesSquare} label="Model comparison" value="Side by side" detail="Gemini, Claude, Groq, auto fallback, and deterministic local analyst paths." />
      </section>

      <KnowledgePanel playbook={knowledgePlaybooks.ai} />

      <AiChat />
    </div>
  );
}
