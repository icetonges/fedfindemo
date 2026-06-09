import { NextRequest, NextResponse } from "next/server";

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("x-cron-secret") === secret;
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    mode: "live",
    status: "queued",
    sources: ["OMB", "GAO", "OIG", "USAspending", "SAM.gov", "Treasury", "agency budget releases"],
    note: "Live scraping is scaffolded; production jobs should download, validate, normalize, and merge with local baseline records."
  }, { status: 202 });
}
