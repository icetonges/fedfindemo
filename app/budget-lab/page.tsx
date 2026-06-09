import { BookOpenCheck, FileSpreadsheet, LibraryBig, Sigma } from "lucide-react";
import { BarPanel } from "@/components/charts";
import { MetricCard } from "@/components/metric-card";
import { getLocalDataSnapshot, money, numberCompact } from "@/lib/source-data";

export default function BudgetLabPage() {
  const data = getLocalDataSnapshot();
  const pdfs = data.sources.filter((source) => source.extension === "pdf");
  const xlsx = data.sources.filter((source) => source.extension === "xlsx");
  const numericFacts = data.budgetBooks.reduce((sum, book) => sum + book.numericFactCount, 0);
  const exhibits = data.budgetBooks.reduce((sum, book) => sum + book.exhibitCount, 0);
  const bookChart = data.budgetBooks.map((book) => ({ name: book.title.slice(0, 22), value: book.exhibitCount }));

  return (
    <div className="page">
      <header className="page-header">
        <div className="header-copy">
          <p className="eyebrow">Budget Lab</p>
          <h1>Fiscal-year comparisons, budget-book extraction, and formulation analytics.</h1>
          <p>The first pass reads structured DoD JSON and inventories the PDF/XLSX corpus so later extraction can move into normalized Neon budget tables.</p>
        </div>
      </header>

      <section className="grid cols-4">
        <MetricCard icon={BookOpenCheck} label="Structured budget books" value={numberCompact(data.budgetBooks.length)} detail="Nested JSON budget books are traversed into exhibit and fact summaries." />
        <MetricCard icon={LibraryBig} label="PDF budget documents" value={numberCompact(pdfs.length)} detail="Budget overview, weapons, construction, O&M, and exhibit PDFs are queued." />
        <MetricCard icon={FileSpreadsheet} label="Spreadsheet exhibits" value={numberCompact(xlsx.length)} detail="FY2026 display workbooks are inventoried for table extraction." />
        <MetricCard icon={Sigma} label="Numeric facts" value={numberCompact(numericFacts)} detail="Financial-looking fields from structured JSON are captured for analyst review." />
      </section>

      <section className="grid cols-2">
        <BarPanel title="JSON budget exhibits by book" data={bookChart} />
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Budget book</th>
                <th>Agency</th>
                <th>Year</th>
                <th>Exhibits</th>
                <th>Largest fact</th>
              </tr>
            </thead>
            <tbody>
              {data.budgetBooks.map((book) => (
                <tr key={book.file}>
                  <td>{book.title}</td>
                  <td>{book.agency}</td>
                  <td>{book.budgetYear}</td>
                  <td>{book.exhibitCount}</td>
                  <td>{book.largestNumericFacts[0] ? money(book.largestNumericFacts[0].value) : "Queued"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Document Extraction Backlog</h2>
          <span className="pill">{pdfs.length + xlsx.length} files</span>
        </div>
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Type</th>
                <th>Fiscal year</th>
                <th>Bytes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[...pdfs, ...xlsx].slice(0, 14).map((source) => (
                <tr key={source.id}>
                  <td>{source.name}</td>
                  <td>{source.extension.toUpperCase()}</td>
                  <td>{source.fiscalYear}</td>
                  <td>{numberCompact(source.bytes)}</td>
                  <td><span className="status monitoring">{source.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
