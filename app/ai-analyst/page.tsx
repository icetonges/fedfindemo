import { Bot, BrainCircuit, DatabaseZap, MessagesSquare } from "lucide-react";
import { AiChat } from "@/components/ai-chat";
import { MetricCard } from "@/components/metric-card";
import { getLocalDataSnapshot, numberCompact } from "@/lib/source-data";

export default function AiAnalystPage() {
  const data = getLocalDataSnapshot();
  return (
    <div className="page">
      <header className="page-header">
        <div className="header-copy">
          <p className="eyebrow">AI Analyst</p>
          <h1>Task-profiled assistant for budget, audit, document, and anomaly workflows.</h1>
          <p>The endpoint uses local source summaries as grounding context and is ready for Gemini, Claude, and Groq fallback when keys are configured.</p>
        </div>
      </header>

      <section className="grid cols-3">
        <MetricCard icon={DatabaseZap} label="Grounding files" value={numberCompact(data.sources.length)} detail="The model receives a compact summary of local file inventory and parsed facts." />
        <MetricCard icon={BrainCircuit} label="Task profiles" value="5" detail="Budget, audit, anomaly, document, and data-quality prompts." />
        <MetricCard icon={MessagesSquare} label="Provider mode" value="Fallback" detail="Gemini, Claude, and Groq are selected when API keys exist." />
      </section>

      <AiChat />
    </div>
  );
}
