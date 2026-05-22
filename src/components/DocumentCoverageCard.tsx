import type { MemoDocumentCoverageItem } from "@/types/core";

function tone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "strong" || normalized === "supported") return "border-[#6d8f66] text-[#2f5d35]";
  if (normalized === "partial" || normalized === "partially supported") return "border-[#b9924f] text-[#7b5b25]";
  if (normalized === "thin" || normalized === "missing") return "border-[#b9a6a0] text-[#9a3e33]";
  if (normalized === "private diligence required" || normalized === "cannot know from public docs") return "border-[#8b8174] text-[#4a4842]";
  return "border-[#b9a6a0] text-[#9a3e33]";
}

export function DocumentCoverageCard({ coverage }: { coverage?: MemoDocumentCoverageItem[] }) {
  if (!coverage?.length) return null;

  return (
    <section className="mt-6 border border-[#d9d3c8] bg-[#fbfaf7] p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-base font-semibold text-[#7b5b25]">Document Coverage</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#151514]">Ranked manifest support by deployment layer</h2>
        </div>
        <p className="max-w-md text-base leading-7 text-[#63615b]">Uses the 150-document manifest metadata only. Full text ingestion is scaffolded, not yet active.</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {coverage.map((row) => (
          <article key={row.layer} className="border border-[#d9d3c8] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-base font-semibold leading-6 text-[#3f3d38]">{row.layer}</p>
            </div>
            <div className="mt-3 grid gap-2 text-sm leading-6">
              <p>
                <span className="font-semibold text-[#151514]">Corpus coverage: </span>
                <span className={`border px-2 py-0.5 font-semibold ${tone(row.corpusCoverage)}`}>{row.corpusCoverage}</span>
              </p>
              <p>
                <span className="font-semibold text-[#151514]">Target-specific support: </span>
                <span className={`border px-2 py-0.5 font-semibold ${tone(row.targetSpecificSupport)}`}>{row.targetSpecificSupport}</span>
              </p>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#63615b]">{row.conclusion}</p>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-[#4a4842]">
              {row.topDocuments.slice(0, 3).map((document) => (
                <li key={`${row.layer}-${document.rank}`}>#{document.rank} {document.title}</li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}
