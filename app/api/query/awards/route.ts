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
  const awardType = params.get("awardType") ?? "";
  const agency = params.get("agency") ?? "";
  const state = params.get("state") ?? "";
  const search = params.get("search") ?? "";
  const limit = Math.min(Number(params.get("limit") ?? 100), 500);

  const rows = data.awardTransactions
    .filter((award) => !fiscalYear || award.fiscalYear === fiscalYear)
    .filter((award) => !awardType || award.awardType === awardType)
    .filter((award) => !agency || includes(award.agency, agency) || includes(award.subAgency, agency))
    .filter((award) => !state || includes(award.state, state))
    .filter((award) => !search || [award.recipient, award.naics, award.productOrService, award.description, award.objectClass].some((value) => includes(value, search)))
    .sort((a, b) => Math.abs(b.obligation) - Math.abs(a.obligation));

  const totalObligations = rows.reduce((sum, award) => sum + award.obligation, 0);
  const byRecipient = Object.values(rows.reduce<Record<string, { name: string; value: number; count: number }>>((acc, award) => {
    const name = award.recipient || "Missing recipient";
    acc[name] ??= { name, value: 0, count: 0 };
    acc[name].value += award.obligation;
    acc[name].count += 1;
    return acc;
  }, {})).sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 12);

  return NextResponse.json({
    generatedAt: data.generatedAt,
    filters: { fiscalYear, awardType, agency, state, search, limit },
    totalMatches: rows.length,
    totalObligations,
    byRecipient,
    rows: rows.slice(0, limit)
  });
}
