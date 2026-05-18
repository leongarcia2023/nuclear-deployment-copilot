import type { ReadinessScore } from "@/types/core";
import { BandBadge, EvidenceBadge, SectionShell } from "./provenance";

export function ReadinessScoreCards({ scores }: { scores: ReadinessScore[] }) {
  return (
    <SectionShell title="Readiness Scorecards" kicker="Can this become fuel demand?">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {scores.map((score) => (
          <article key={score.id} className="border border-[#d9d3c8] bg-[#fbfaf7] p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="min-h-12 text-base font-semibold leading-6">{score.label}</h3>
              <BandBadge band={score.band} />
            </div>
            <div className="mt-5">
              <div className="flex items-end gap-1">
                <span className="text-4xl font-semibold">{score.score}</span>
                <span className="pb-1 text-sm text-[#63615b]">/{score.maxScore}</span>
              </div>
              <div className="mt-3 h-2 bg-[#e6ded0]">
                <div className="h-full bg-[#256c55]" style={{ width: `${score.score}%` }} />
              </div>
            </div>
            <div className="mt-4">
              <EvidenceBadge status={score.status} />
            </div>
            <p className="mt-4 text-sm leading-6 text-[#4a4842]">{score.rationale}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
