import type { FuelCycleDependency } from "@/types/core";
import { EvidenceBadge, SectionShell } from "./provenance";

const exposureTone = {
  low: "bg-[#dce9dd] text-[#24523c]",
  medium: "bg-[#e8dfc8] text-[#6b4d16]",
  high: "bg-[#ead1bd] text-[#7c4115]",
  critical: "bg-[#ead0cc] text-[#82362e]",
};

export function FuelCycleDependencyMap({ dependencies }: { dependencies: FuelCycleDependency[] }) {
  return (
    <SectionShell title="Fuel-Cycle Dependency Map" kicker="Where supplier risk concentrates">
      <div className="grid gap-4 lg:grid-cols-4">
        {dependencies.map((dependency, index) => (
          <article key={dependency.id} className="relative border border-[#d9d3c8] bg-[#fbfaf7] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#151514] text-sm font-bold text-white">
                {index + 1}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${exposureTone[dependency.exposure]}`}>
                {dependency.exposure}
              </span>
            </div>
            <h3 className="text-lg font-semibold">{dependency.dependency}</h3>
            <p className="mt-2 text-sm font-bold text-[#7b5b25]">{dependency.needBy}</p>
            <div className="mt-4">
              <EvidenceBadge status={dependency.status} />
            </div>
            <p className="mt-4 text-sm leading-6 text-[#4a4842]">{dependency.currentEvidence}</p>
            <div className="mt-4 border-t border-[#d9d3c8] pt-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#63615b]">Proof needed</p>
              <p className="mt-2 text-sm leading-6">{dependency.proofNeeded}</p>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
