import { Anthropic } from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { FEDERAL_FINANCE_SYSTEM_PROMPT, buildGroundingContext, localDeepAnalysis } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const modelLabels = {
  auto: "Auto fallback",
  google: "Gemini 1.5 Flash",
  anthropic: "Claude 3.5 Sonnet",
  groq: "Llama 3.3 70B",
  local: "Local deterministic analyst"
} as const;

type ModelKey = keyof typeof modelLabels;

function sanitizeModel(value: unknown): ModelKey {
  const model = String(value ?? "auto");
  return model === "google" || model === "anthropic" || model === "groq" || model === "local" || model === "auto" ? model : "auto";
}

async function runModel(model: ModelKey, prompt: string, profile: string, message: string, focus: string) {
  if ((model === "auto" || model === "google") && process.env.GOOGLE_AI_API_KEY) {
    const client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const gemini = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await gemini.generateContent(prompt);
    return { model: "google", label: modelLabels.google, answer: result.response.text() };
  }

  if ((model === "auto" || model === "anthropic") && process.env.ANTHROPIC_API_KEY) {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const result = await client.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 1400,
      system: FEDERAL_FINANCE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }]
    });
    const answer = result.content.map((part) => (part.type === "text" ? part.text : "")).join("");
    return { model: "anthropic", label: modelLabels.anthropic, answer };
  }

  if ((model === "auto" || model === "groq") && process.env.GROQ_API_KEY) {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const result = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: FEDERAL_FINANCE_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ]
    });
    return { model: "groq", label: modelLabels.groq, answer: result.choices[0]?.message?.content ?? "" };
  }

  return { model: "local", label: modelLabels.local, answer: await localDeepAnalysis(profile, message, focus) };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const profile = String(body.profile ?? "Budget analyst").slice(0, 80);
  const focus = String(body.focus ?? "enterprise").slice(0, 80);
  const message = String(body.message ?? "").slice(0, 5000);
  const modelA = sanitizeModel(body.modelA);
  const modelB = sanitizeModel(body.modelB);
  const compare = Boolean(body.compare);
  if (!message.trim()) return NextResponse.json({ error: "Message is required." }, { status: 400 });

  const context = await buildGroundingContext();
  const prompt = [
    FEDERAL_FINANCE_SYSTEM_PROMPT,
    `Task profile: ${profile}`,
    `Dataset focus: ${focus}`,
    "Return a decision-grade analysis with sections for executive finding, quantified drivers, risks/controls, recommended actions, and source evidence.",
    `Source context:\n${context}`,
    `User request:\n${message}`
  ].join("\n\n");

  try {
    const results = compare
      ? await Promise.all([runModel(modelA, prompt, profile, message, focus), runModel(modelB, prompt, profile, message, focus)])
      : [await runModel(modelA, prompt, profile, message, focus)];
    return NextResponse.json({ profile, focus, compare, results });
  } catch (error) {
    return NextResponse.json({
      profile,
      focus,
      compare,
      warning: error instanceof Error ? error.message.slice(0, 240) : "AI provider failed.",
      results: [{ model: "local", label: modelLabels.local, answer: await localDeepAnalysis(profile, message, focus) }]
    });
  }
}
