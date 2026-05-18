import type { ProjectCounterpartyProfile, UserMode } from "@/types/core";
import { CounterpartyQuestions } from "./CounterpartyQuestions";
import { EvidenceQualityTable } from "./EvidenceQualityTable";
import { FuelCycleDependencyMap } from "./FuelCycleDependencyMap";
import { MemoPanel } from "./MemoPanel";
import { ProfileHeader } from "./ProfileHeader";
import { ReadinessScoreCards } from "./ReadinessScoreCards";
import { RecommendedActionCard } from "./RecommendedActionCard";
import { SourceCitationsPanel } from "./SourceCitationsPanel";
import { UnknownsRegister } from "./UnknownsRegister";

const modeLens: Record<
  UserMode,
  {
    label: string;
    decision: string;
    emphasis: string;
    focus: string[];
  }
> = {
  "fuel-cycle supplier": {
    label: "Supplier lens",
    decision: "Should we reserve scarce HALEU or fuel-cycle capacity for this counterparty?",
    emphasis: "The dashboard prioritizes first-core timing, assay/spec proof, reservation authority, fabrication path, and credit support.",
    focus: ["Fuel specification maturity", "Reservation economics", "Delivery window risk"],
  },
  "incumbent / strategic partner": {
    label: "Strategic partner lens",
    decision: "Is this project mature enough for partnership, site support, or supply-chain coordination?",
    emphasis: "The dashboard elevates licensing posture, site readiness, execution dependencies, and partner diligence gaps.",
    focus: ["Licensing path", "Site and customer pull", "Execution dependencies"],
  },
  investor: {
    label: "Investor lens",
    decision: "Is the deployability evidence strong enough to support valuation or financing claims?",
    emphasis: "The dashboard separates milestone-backed claims from narrative risk, especially around offtake, financing, and schedule credibility.",
    focus: ["Financeability", "Milestone evidence", "Downside triggers"],
  },
  developer: {
    label: "Developer lens",
    decision: "What proof package would convince suppliers, partners, customers, and capital providers?",
    emphasis: "The dashboard turns unknowns into an evidence checklist for the next data room, memo revision, or counterparty meeting.",
    focus: ["Missing proof", "Counterparty questions", "Data room readiness"],
  },
};

function ModeLensPanel({ mode }: { mode: UserMode }) {
  const lens = modeLens[mode];

  return (
    <section className="my-6 border border-[#d9d3c8] bg-[#fbfaf7] p-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_0.7fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b5b25]">{lens.label}</p>
          <h2 className="mt-2 text-2xl font-semibold">{lens.decision}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#4a4842]">{lens.emphasis}</p>
        </div>
        <div className="border border-[#d9d3c8] bg-[#f4f1ea] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#63615b]">Dashboard emphasis</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {lens.focus.map((item) => (
              <span key={item} className="rounded-full border border-[#bfb6a7] bg-[#fbfaf7] px-3 py-1 text-sm font-semibold text-[#292824]">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Dashboard({ profile, mode }: { profile: ProjectCounterpartyProfile; mode: UserMode }) {
  return (
    <div id="dashboard" className="bg-[#f4f1ea]">
      <ProfileHeader profile={profile} />
      <main className="mx-auto max-w-7xl px-5 py-4 sm:px-8">
        <ModeLensPanel mode={mode} />
        <ReadinessScoreCards scores={profile.readinessScores} />
        <FuelCycleDependencyMap dependencies={profile.fuelCycleDependencies} />
        <EvidenceQualityTable rows={profile.evidenceQuality} />
        <UnknownsRegister unknowns={profile.unknowns} />
        <CounterpartyQuestions questions={profile.counterpartyQuestions} />
        <RecommendedActionCard action={profile.recommendedAction} />
        <MemoPanel memo={profile.memo} />
        <SourceCitationsPanel sources={profile.sources} />
      </main>
    </div>
  );
}
