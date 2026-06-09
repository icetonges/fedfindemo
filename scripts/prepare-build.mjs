import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = process.cwd();
const outputFile = path.join(root, "generated", "local-data.json.gz");

function validateSnapshot() {
  if (!fs.existsSync(outputFile)) {
    throw new Error(`Missing ${path.relative(root, outputFile)}. Run npm run snapshot locally and commit the generated artifact.`);
  }

  const snapshot = JSON.parse(zlib.gunzipSync(fs.readFileSync(outputFile)).toString("utf8"));
  const sources = snapshot.sources?.length ?? 0;
  const budgetObservations = snapshot.budgetInsights?.totalLineObservations ?? 0;
  const awardRows = snapshot.awardInsights?.totalRows ?? 0;
  const auditDocuments = snapshot.auditDocuments?.length ?? 0;

  if (sources <= 0 || budgetObservations <= 0 || awardRows <= 0) {
    throw new Error(
      `Refusing to build an empty dataset: ${sources} sources, ${budgetObservations} budget observations, ${awardRows} award rows.`
    );
  }

  console.log(
    `Using ${path.relative(root, outputFile)} with ${sources} sources, ${budgetObservations} budget observations, ${awardRows} award rows, and ${auditDocuments} audit documents.`
  );
}

validateSnapshot();
