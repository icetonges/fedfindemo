import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "Federal Financial Management Demo",
    timestamp: new Date().toISOString(),
    providers: {
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      google: Boolean(process.env.GOOGLE_AI_API_KEY),
      groq: Boolean(process.env.GROQ_API_KEY),
      neon: Boolean(process.env.DATABASE_URL)
    }
  });
}
