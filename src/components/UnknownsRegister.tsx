import type { UnknownItem } from "@/types/core";
import { EvidenceBadge, SectionShell } from "./provenance";

export function UnknownsRegister({ unknowns }: { unknowns: UnknownItem[] }) {
  return (
    <SectionShell title="Unknowns Register" kicker="What could break the thesis">
      <div className="grid gap-4 md:grid-cols-2">
        {unknowns.map((item) => (
          <article key={item.id} className="border border-[#d9d3c8] bg-[#fbfaf7] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <EvidenceBadge status={item.status} />
              <span className="rounded-full bg-[#151514] px-2.5 py-1 text-xs font-bold uppercase text-white">{item.severity}</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold leading-7">{item.unknown}</h3>
            <p className="mt-4 text-sm font-bold text-[#7b5b25]">{item.owner}</p>
            <p className="mt-2 text-sm leading-6 text-[#4a4842]">{item.nextStep}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
