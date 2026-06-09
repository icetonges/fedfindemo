import { Workflow } from "lucide-react";
import { SolutionGalleryWorkbench } from "@/components/solution-gallery-workbench";
import { getSolutionMetadata } from "@/lib/solutions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SolutionGalleryPage() {
  const metadata = await getSolutionMetadata();

  return (
    <div className="page">
      <header className="page-header">
        <div className="header-copy">
          <p className="eyebrow">Solution Gallery</p>
          <h1>Actionable AI and ML solution workbench for federal finance operations.</h1>
          <p>Select a solution, choose candidate source datasets, run a purpose-specific model workflow, and inspect drivers, evidence, diagnostics, and recommended actions.</p>
        </div>
        <span className="pill"><Workflow size={14} /> {metadata.sources.length} source candidates</span>
      </header>

      <SolutionGalleryWorkbench solutions={metadata.solutions} models={metadata.models} sources={metadata.sources} />
    </div>
  );
}
