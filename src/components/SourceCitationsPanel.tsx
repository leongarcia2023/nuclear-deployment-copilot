import type { EvidenceRef } from "@/types/core";
import { EvidenceBadge, SectionShell } from "./provenance";

export function SourceCitationsPanel({ sources }: { sources: EvidenceRef[] }) {
  return (
    <SectionShell title="Source Citations" kicker="Every finding carries provenance">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sources.map((source) => (
          <article key={source.id} className="border border-[#d9d3c8] bg-[#fbfaf7] p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-xs font-bold text-[#63615b]">{source.id}</span>
              <EvidenceBadge status={source.sourceType} />
            </div>
            <h3 className="text-lg font-semibold leading-7">{source.title}</h3>
            <p className="mt-2 text-sm text-[#63615b]">
              {source.publisher} · {source.date} · {source.confidence} confidence
            </p>
            <p className="mt-4 text-sm leading-6 text-[#4a4842]">{source.excerpt}</p>
            {source.url ? (
              <a className="mt-4 inline-flex text-sm font-bold text-[#255d82] underline-offset-4 hover:underline" href={source.url}>
                Open source
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
