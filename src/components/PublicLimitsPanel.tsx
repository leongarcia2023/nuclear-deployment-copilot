import { EyeOff } from "lucide-react";
import { SectionShell } from "./provenance";

export function PublicLimitsPanel({ items }: { items: string[] }) {
  return (
    <SectionShell title="What This Tool Cannot Know From Public Documents" kicker="No hidden-truth theater">
      <div className="border border-[#151514] bg-[#151514] p-5 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-[#d6c7a8]" />
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d6c7a8]">Public-source boundary</p>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#eee7d9]">
              These items should stay unknown unless a counterparty supplies sanitized, permissioned evidence or the fact becomes public.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item} className="border border-white/20 bg-white/[0.03] px-3 py-3 text-sm font-semibold leading-6">
              {item}
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
