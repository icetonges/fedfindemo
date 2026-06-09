import { NextResponse } from "next/server";
import { getLocalDataSnapshot } from "@/lib/source-data";

export async function GET() {
  const data = getLocalDataSnapshot();
  return NextResponse.json({
    generatedAt: data.generatedAt,
    budgetBooks: data.budgetBooks,
    documents: data.sources.filter((source) => source.domain === "budget" || source.domain === "document" || source.domain === "exhibit")
  });
}
