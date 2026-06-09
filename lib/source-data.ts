import { cache } from "react";
import snapshot from "@/generated/local-data.json";
import type { LocalDataSnapshot } from "./types";

export const getLocalDataSnapshot = cache((): LocalDataSnapshot => snapshot as unknown as LocalDataSnapshot);

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
