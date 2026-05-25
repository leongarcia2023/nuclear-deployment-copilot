import type { ProjectCounterpartyProfile } from "@/types/core";
import { analysisModeCopy } from "@/lib/analysis/analysisModes";
import { ExecutiveVerdictCard } from "./ExecutiveVerdictCard";
import { ResultsTabs } from "./ResultsTabs";

export function Dashboard({ profile }: { profile: ProjectCounterpartyProfile }) {
  const mode = profile.claimToIcMemo.analysisMode ?? "demo";

  return (
    <main id="dashboard" className="bg-[#f4f1ea] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-base font-semibold text-[#7b5b25]">Claim-to-IC Memo · {analysisModeCopy[mode].label}</p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight text-[#151514]">{profile.claimToIcMemo.firstPassIcMemo.target}</h1>
          <p className="mt-2 text-lg leading-8 text-[#151514]">{profile.claimToIcMemo.firstPassIcMemo.decision}</p>
          <p className="mt-3 max-w-3xl border border-[#d9d3c8] bg-[#fbfaf7] p-3 text-base leading-7 text-[#63615b]">
            {profile.claimToIcMemo.analysisModeNote ?? "Demo mode uses deterministic templates and curated source notes. No OpenAI calls are made."}
          </p>
        </div>
        <ExecutiveVerdictCard profile={profile} />
        <ResultsTabs profile={profile} />
      </div>
    </main>
  );
}
