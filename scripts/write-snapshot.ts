import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const outputFile = path.join(process.cwd(), "generated", "local-data.json.gz");
const sourceRoot = path.join(process.cwd(), "sourcedata");

async function main() {
  if (process.env.VERCEL && fs.existsSync(outputFile) && (!fs.existsSync(sourceRoot) || fs.readdirSync(sourceRoot).length === 0)) {
    console.log(`Using committed ${path.relative(process.cwd(), outputFile)} for Vercel build.`);
    return;
  }

  const { buildSourceDataSnapshot } = await import("../lib/source-data-live");
  const snapshot = await buildSourceDataSnapshot();

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, zlib.gzipSync(JSON.stringify(snapshot)));

  console.log(
    `Wrote ${path.relative(process.cwd(), outputFile)} with ${snapshot.sources.length} sources, ${snapshot.budgetInsights.totalLineObservations} budget observations, ${snapshot.awardInsights.totalRows} award rows, and ${snapshot.auditDocuments.length} audit documents.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
