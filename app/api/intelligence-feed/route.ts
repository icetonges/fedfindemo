import { NextResponse } from "next/server";
import { getLocalDataSnapshot } from "@/lib/source-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const data = await getLocalDataSnapshot();
  return NextResponse.json({
    generatedAt: data.generatedAt,
    items: data.intelligenceItems
  });
}
