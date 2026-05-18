import type { EvidenceQualityItem } from "@/types/core";
import { EvidenceBadge, SectionShell } from "./provenance";

export function EvidenceQualityTable({ rows }: { rows: EvidenceQualityItem[] }) {
  return (
    <SectionShell title="Evidence Quality" kicker="Claim-by-claim confidence">
      <div className="overflow-hidden border border-[#d9d3c8] bg-[#fbfaf7]">
        <div className="grid grid-cols-12 border-b border-[#d9d3c8] bg-[#eee7d9] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#63615b]">
          <span className="col-span-5">Claim</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2">Quality</span>
          <span className="col-span-3">Diligence implication</span>
        </div>
        {rows.map((row) => (
          <div key={row.id} className="grid grid-cols-1 gap-3 border-b border-[#d9d3c8] px-4 py-4 last:border-b-0 md:grid-cols-12">
            <p className="md:col-span-5">{row.claim}</p>
            <div className="md:col-span-2">
              <EvidenceBadge status={row.status} />
            </div>
            <p className="font-semibold capitalize md:col-span-2">{row.quality}</p>
            <p className="text-sm leading-6 text-[#4a4842] md:col-span-3">{row.diligenceImplication}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
