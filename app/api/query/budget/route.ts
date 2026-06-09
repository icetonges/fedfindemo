import { NextRequest, NextResponse } from "next/server";
import { getLocalDataSnapshot } from "@/lib/source-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function includes(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export async function GET(request: NextRequest) {
  const data = await getLocalDataSnapshot();
  const params = request.nextUrl.searchParams;
  const fiscalYear = params.get("fiscalYear") ?? "";
  const scenario = params.get("scenario") ?? "";
  const family = params.get("family") ?? "";
  const search = params.get("search") ?? "";
  const limit = Math.min(Number(params.get("limit") ?? 100), 500);

  const rows = data.budgetLines
    .filter((line) => !fiscalYear || line.fiscalYear === fiscalYear)
    .filter((line) => !scenario || includes(line.scenario, scenario))
    .filter((line) => !family || line.appropriationFamily === family)
    .filter((line) => !search || [line.accountTitle, line.programTitle, line.budgetActivityTitle, line.source].some((value) => includes(value, search)))
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

  const totals = rows.reduce((sum, line) => sum + line.amount, 0);
  const byAccount = Object.values(rows.reduce<Record<string, { name: string; value: number; count: number }>>((acc, line) => {
    const name = line.accountTitle || "Unspecified account";
    acc[name] ??= { name, value: 0, count: 0 };
    acc[name].value += line.amount;
    acc[name].count += 1;
    return acc;
  }, {})).sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 12);

  return NextResponse.json({
    generatedAt: data.generatedAt,
    filters: { fiscalYear, scenario, family, search, limit },
    totalMatches: rows.length,
    totalAmount: totals,
    byAccount,
    rows: rows.slice(0, limit)
  });
}
