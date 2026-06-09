import { NextResponse } from "next/server";
import { getLocalDataSnapshot } from "@/lib/source-data";

export async function GET() {
  const data = getLocalDataSnapshot();
  return NextResponse.json({
    generatedAt: data.generatedAt,
    sources: data.sources,
    counts: {
      total: data.sources.length,
      parsed: data.sources.filter((source) => source.status === "parsed").length,
      inventoried: data.sources.filter((source) => source.status === "inventoried").length
    }
  });
}
