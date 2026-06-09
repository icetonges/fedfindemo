import { NextRequest, NextResponse } from "next/server";
import { getLocalDataSnapshot } from "@/lib/source-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ChartRow = { name: string; value: number; count: number };

function sortRows(rows: ChartRow[]) {
  return rows.sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 14);
}

export async function GET(request: NextRequest) {
  const data = await getLocalDataSnapshot();
  const params = request.nextUrl.searchParams;
  const scope = params.get("scope") ?? "budget";
  const groupBy = params.get("groupBy") ?? "family";
  const fiscalYear = params.get("fiscalYear") ?? "";
  const source = params.get("source") ?? "";
  const family = params.get("family") ?? "";
  const awardType = params.get("awardType") ?? "";

  if (scope === "awards") {
    const rows = data.awardTransactions
      .filter((award) => !fiscalYear || award.fiscalYear === fiscalYear)
      .filter((award) => !source || award.source === source)
      .filter((award) => !awardType || award.awardType === awardType)
      .reduce<Record<string, ChartRow>>((acc, award) => {
        const key = groupBy === "state" ? award.state : groupBy === "agency" ? award.subAgency || award.agency : groupBy === "month" ? award.actionDate.slice(0, 7) || "Unknown" : award.recipient || "Missing recipient";
        acc[key] ??= { name: key, value: 0, count: 0 };
        acc[key].value += award.obligation;
        acc[key].count += 1;
        return acc;
      }, {});

    return NextResponse.json({
      generatedAt: data.generatedAt,
      filters: { scope, groupBy, fiscalYear, source, awardType },
      chart: sortRows(Object.values(rows)),
      sources: [...new Set(data.awardTransactions.map((award) => award.source))].slice(0, 40)
    });
  }

  if (scope === "sources") {
    const rows = data.sources.reduce<Record<string, ChartRow>>((acc, item) => {
      const key = groupBy === "domain" ? item.domain : groupBy === "type" ? item.extension.toUpperCase() : item.folder.split("/")[0] || "sourcedata";
      acc[key] ??= { name: key, value: 0, count: 0 };
      acc[key].value += 1;
      acc[key].count += 1;
      return acc;
    }, {});
    return NextResponse.json({ generatedAt: data.generatedAt, filters: { scope, groupBy }, chart: sortRows(Object.values(rows)), sources: data.sources.map((item) => item.relativePath).slice(0, 40) });
  }

  const rows = data.budgetLines
    .filter((line) => !fiscalYear || line.fiscalYear === fiscalYear)
    .filter((line) => !source || line.source === source)
    .filter((line) => !family || line.appropriationFamily === family)
    .reduce<Record<string, ChartRow>>((acc, line) => {
      const key = groupBy === "account" ? line.accountTitle : groupBy === "scenario" ? line.scenario : groupBy === "activity" ? line.budgetActivityTitle : line.appropriationFamily;
      acc[key] ??= { name: key || "Unspecified", value: 0, count: 0 };
      acc[key].value += line.amount;
      acc[key].count += 1;
      return acc;
    }, {});

  return NextResponse.json({
    generatedAt: data.generatedAt,
    filters: { scope, groupBy, fiscalYear, source, family },
    chart: sortRows(Object.values(rows)),
    sources: [...new Set(data.budgetLines.map((line) => line.source))].slice(0, 40)
  });
}
