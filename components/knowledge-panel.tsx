import { BookOpenText, ExternalLink } from "lucide-react";
import type { KnowledgePlaybook } from "@/lib/knowledge-content";

export function KnowledgePanel({ playbook }: { playbook: KnowledgePlaybook }) {
  return (
    <section className="knowledge-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">{playbook.eyebrow}</p>
          <h2>{playbook.title}</h2>
          <p>{playbook.summary}</p>
        </div>
        <span className="pill"><BookOpenText size={14} /> Research-backed</span>
      </div>
      <div className="knowledge-grid">
        {playbook.sections.map((section) => (
          <article className="knowledge-section" key={section.title}>
            <h3>{section.title}</h3>
            <p>{section.body}</p>
            <ul>
              {section.bullets.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
        ))}
      </div>
      <div className="reference-strip">
        {playbook.references.map((reference) => (
          <a className="reference-link" href={reference.href} key={reference.href} target="_blank" rel="noreferrer">
            <span>
              <strong>{reference.label}</strong>
              <small>{reference.note}</small>
            </span>
            <ExternalLink size={15} />
          </a>
        ))}
      </div>
    </section>
  );
}
