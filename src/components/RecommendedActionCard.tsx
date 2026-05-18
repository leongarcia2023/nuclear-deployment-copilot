import type { RecommendedAction } from "@/types/core";
import { EvidenceBadge } from "./provenance";

export function RecommendedActionCard({ action }: { action: RecommendedAction }) {
  return (
    <section className="my-8 border border-[#151514] bg-[#151514] p-5 text-white sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d6c7a8]">Recommended action</p>
          <h2 className="mt-2 text-3xl font-semibold capitalize">{action.decision}</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#eee7d9]">{action.rationale}</p>
        </div>
        <EvidenceBadge status={action.status} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.55fr]">
        <div className="border border-white/20 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d6c7a8]">Conditions</p>
          <ul className="mt-3 space-y-3">
            {action.conditions.map((condition) => (
              <li key={condition} className="text-sm leading-6 text-[#fbfaf7]">
                {condition}
              </li>
            ))}
          </ul>
        </div>
        <div className="border border-white/20 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d6c7a8]">Next review trigger</p>
          <p className="mt-3 text-sm leading-6 text-[#fbfaf7]">{action.nextReviewTrigger}</p>
        </div>
      </div>
    </section>
  );
}
