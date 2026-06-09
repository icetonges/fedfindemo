import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const outputFile = path.join(process.cwd(), "generated", "local-data.json.gz");
const sourceRoot = path.join(process.cwd(), "sourcedata");

function readSnapshotSummary(file: string) {
  const snapshot = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString("utf8"));
  return {
    sources: snapshot.sources?.length ?? 0,
    budgetObservations: snapshot.budgetInsights?.totalLineObservations ?? 0,
    awardRows: snapshot.awardInsights?.totalRows ?? 0,
    auditDocuments: snapshot.auditDocuments?.length ?? 0
  };
}

function assertUsableSnapshot(summary: { sources: number; budgetObservations: number; awardRows: number }) {
  if (summary.sources <= 0 || summary.budgetObservations <= 0 || summary.awardRows <= 0) {
    throw new Error(
      `Refusing to build an empty federal finance dataset. Snapshot has ${summary.sources} sources, ${summary.budgetObservations} budget observations, and ${summary.awardRows} award rows.`
    );
  }
}

async function main() {
  const sourceFilesAvailable = fs.existsSync(sourceRoot) && fs.readdirSync(sourceRoot).length > 0;

  if (process.env.VERCEL && !sourceFilesAvailable) {
    if (!fs.existsSync(outputFile)) {
      throw new Error(
        `Vercel build does not include sourcedata/. Commit ${path.relative(process.cwd(), outputFile)} before deploying, or remove sourcedata from .vercelignore.`
      );
    }
    const summary = readSnapshotSummary(outputFile);
    assertUsableSnapshot(summary);
    console.log(
      `Using committed ${path.relative(process.cwd(), outputFile)} for Vercel build with ${summary.sources} sources, ${summary.budgetObservations} budget observations, ${summary.awardRows} award rows, and ${summary.auditDocuments} audit documents.`
    );
    return;
  }

  const { buildSourceDataSnapshot } = await import("../lib/source-data-live");
  const snapshot = await buildSourceDataSnapshot();
  assertUsableSnapshot({
    sources: snapshot.sources.length,
    budgetObservations: snapshot.budgetInsights.totalLineObservations,
    awardRows: snapshot.awardInsights.totalRows
  });

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, zlib.gzipSync(JSON.stringify(snapshot), { mtime: 0 } as zlib.ZlibOptions));

  console.log(
    `Wrote ${path.relative(process.cwd(), outputFile)} with ${snapshot.sources.length} sources, ${snapshot.budgetInsights.totalLineObservations} budget observations, ${snapshot.awardInsights.totalRows} award rows, and ${snapshot.auditDocuments.length} audit documents.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
