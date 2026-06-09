import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { unstable_noStore as noStore } from "next/cache";
import type { LocalDataSnapshot } from "./types";

const GENERATED_SNAPSHOT = path.join(process.cwd(), "generated", "local-data.json.gz");

function readGeneratedSnapshot(): LocalDataSnapshot {
  if (!fs.existsSync(GENERATED_SNAPSHOT)) {
    throw new Error("Generated data snapshot is missing. Run `npm run snapshot` or `npm run build`.");
  }
  return JSON.parse(zlib.gunzipSync(fs.readFileSync(GENERATED_SNAPSHOT)).toString("utf8")) as LocalDataSnapshot;
}

export async function getLocalDataSnapshot(): Promise<LocalDataSnapshot> {
  noStore();

  if (process.env.NODE_ENV === "production" || process.env.VERCEL || process.env.USE_GENERATED_DATA === "1") {
    return readGeneratedSnapshot();
  }

  const liveModule = "./source-data-live";
  const live = await import(liveModule);
  return live.getLocalDataSnapshot();
}

export function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: Math.abs(value) >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: 1
  }).format(value);
}

export function numberCompact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
