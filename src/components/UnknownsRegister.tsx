import type { UnknownItem } from "@/types/core";
import { SectionShell, statusLabel } from "./provenance";

export function UnknownsRegister({ unknowns }: { unknowns: UnknownItem[] }) {
  return (
    <SectionShell title="Unknowns Register" kicker="What public evidence cannot settle">
      <div className="overflow-hidden border border-[#d9d3c8] bg-[#fbfaf7]">
        <div className="grid grid-cols-12 border-b border-[#d9d3c8] bg-[#eee7d9] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#63615b]">
          <span className="col-span-3">Unknown</span>
          <span className="col-span-2">Why it matters</span>
          <span className="col-span-2">Who answers</span>
          <span className="col-span-3">Required evidence</span>
          <span className="col-span-1">Tier</span>
          <span className="col-span-1">Severity</span>
        </div>
        {unknowns.map((item) => (
          <article key={item.id} className="grid grid-cols-1 gap-3 border-b border-[#d9d3c8] px-4 py-4 last:border-b-0 md:grid-cols-12">
            <div className="md:col-span-3">
              <h3 className="font-semibold leading-6">{item.unknown}</h3>
            </div>
            <p className="text-sm leading-6 text-[#4a4842] md:col-span-2">{item.whyItMatters}</p>
            <p className="text-sm font-semibold leading-6 text-[#292824] md:col-span-2">{item.whoShouldAnswer}</p>
            <p className="text-sm leading-6 text-[#4a4842] md:col-span-3">{item.requiredEvidence}</p>
            <div className="md:col-span-1">
              <span className="text-base font-semibold text-[#3f3d38]">{statusLabel(item.evidenceTier)}</span>
            </div>
            <div className="md:col-span-1">
              <span className="rounded-full bg-[#151514] px-2.5 py-1 text-xs font-bold uppercase text-white">{item.severity}</span>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
