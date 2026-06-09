import { NextResponse } from "next/server";
import { getLocalDataSnapshot } from "@/lib/source-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const data = await getLocalDataSnapshot();
  return NextResponse.json({
    generatedAt: data.generatedAt,
    sourceSignature: data.sourceSignature,
    sources: data.sources,
    counts: {
      total: data.sources.length,
      parsed: data.sources.filter((source) => source.status === "parsed").length,
      inventoried: data.sources.filter((source) => source.status === "inventoried").length
    }
  });
}
