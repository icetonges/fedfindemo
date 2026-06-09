import { NextResponse } from "next/server";
import { getSolutionMetadata } from "@/lib/solutions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(await getSolutionMetadata());
}
