import fs from "node:fs";
import path from "node:path";
import { buildSourceDataSnapshot } from "../lib/source-data";

const outputFile = path.join(process.cwd(), "generated", "local-data.json");

async function main() {
  const snapshot = await buildSourceDataSnapshot();

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(snapshot, null, 2)}\n`);

  console.log(
    `Wrote ${path.relative(process.cwd(), outputFile)} with ${snapshot.sources.length} sources, ${snapshot.budgetLines.length} budget lines, ${snapshot.awardInsights.totalRows} award rows, and ${snapshot.auditDocuments.length} audit documents.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
