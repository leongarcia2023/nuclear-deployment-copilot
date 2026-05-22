import type { EvidenceQualityItem, EvidenceRef } from "@/types/core";
import { statusLabel } from "./provenance";

export function EvidenceTable({ rows, sources }: { rows: EvidenceQualityItem[]; sources: EvidenceRef[] }) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden border border-[#d9d3c8] bg-[#fbfaf7]">
        <div className="grid grid-cols-12 border-b border-[#d9d3c8] bg-[#f0ebe1] px-4 py-3 text-sm font-semibold text-[#63615b]">
          <span className="col-span-5">Claim</span>
          <span className="col-span-2">Evidence tier</span>
          <span className="col-span-2">Quality</span>
          <span className="col-span-3">Diligence implication</span>
        </div>
        {rows.map((row) => (
          <div key={row.id} className="grid grid-cols-1 gap-3 border-b border-[#d9d3c8] px-4 py-4 text-base last:border-b-0 md:grid-cols-12">
            <p className="leading-7 md:col-span-5">{row.claim}</p>
            <p className="font-semibold md:col-span-2">{statusLabel(row.status)}</p>
            <p className="capitalize md:col-span-2">{row.quality}</p>
            <p className="leading-7 text-[#4a4842] md:col-span-3">{row.diligenceImplication}</p>
          </div>
        ))}
      </section>

      <section>
        <h3 className="text-xl font-semibold">Sources</h3>
        <div className="mt-4 space-y-3">
          {sources.map((source) => (
            <article key={source.id} className="border border-[#d9d3c8] bg-[#fbfaf7] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-lg font-semibold">{source.title}</h4>
                  <p className="mt-1 text-base text-[#63615b]">
                    {source.publisher} · {source.date} · {source.confidence} confidence
                  </p>
                </div>
                <span className="text-base font-semibold text-[#3f3d38]">{statusLabel(source.sourceType)}</span>
              </div>
              <p className="mt-3 text-base leading-7 text-[#4a4842]">{source.excerpt}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
