import { NextResponse } from "next/server";
import { getInsightPayload } from "@/lib/insights";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(await getInsightPayload(id));
}
