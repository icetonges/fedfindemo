import { Anthropic } from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { FEDERAL_FINANCE_SYSTEM_PROMPT, buildGroundingContext, localAnalystResponse } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const profile = String(body.profile ?? "Budget analyst").slice(0, 80);
  const message = String(body.message ?? "").slice(0, 4000);
  if (!message.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const context = await buildGroundingContext();
  const prompt = `${FEDERAL_FINANCE_SYSTEM_PROMPT}\n\nTask profile: ${profile}\n\nSource context:\n${context}\n\nUser request:\n${message}`;

  try {
    if (process.env.GOOGLE_AI_API_KEY) {
      const client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
      const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      return NextResponse.json({ provider: "google", answer: result.response.text() });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const result = await client.messages.create({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 900,
        system: FEDERAL_FINANCE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Task profile: ${profile}\n\nSource context:\n${context}\n\nUser request:\n${message}` }]
      });
      const answer = result.content.map((part) => (part.type === "text" ? part.text : "")).join("");
      return NextResponse.json({ provider: "anthropic", answer });
    }

    if (process.env.GROQ_API_KEY) {
      const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const result = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: FEDERAL_FINANCE_SYSTEM_PROMPT },
          { role: "user", content: `Task profile: ${profile}\n\nSource context:\n${context}\n\nUser request:\n${message}` }
        ]
      });
      return NextResponse.json({ provider: "groq", answer: result.choices[0]?.message?.content ?? "" });
    }
  } catch (error) {
    return NextResponse.json({
      provider: "local-fallback",
      warning: error instanceof Error ? error.message : "AI provider failed.",
      answer: await localAnalystResponse(profile, message)
    });
  }

  return NextResponse.json({ provider: "local-fallback", answer: await localAnalystResponse(profile, message) });
}
