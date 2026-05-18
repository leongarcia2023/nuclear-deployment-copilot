import type { MemoSection } from "@/types/core";
import { EvidenceBadge, SectionShell } from "./provenance";

export function MemoPanel({ memo }: { memo: MemoSection[] }) {
  return (
    <SectionShell title="Memo Panel" kicker="Supplier-facing diligence memo">
      <div className="border border-[#d9d3c8] bg-[#fbfaf7] p-5 sm:p-7">
        <div className="space-y-6">
          {memo.map((section) => (
            <section key={section.heading} className="border-b border-[#d9d3c8] pb-6 last:border-b-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-semibold">{section.heading}</h3>
                <EvidenceBadge status={section.status} />
              </div>
              <p className="mt-3 max-w-4xl text-base leading-8 text-[#3f3d38]">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
