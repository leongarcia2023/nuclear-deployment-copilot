import type { ProjectCounterpartyProfile } from "@/types/core";
import { BandBadge, EvidenceBadge } from "./provenance";

export function ProfileHeader({ profile }: { profile: ProjectCounterpartyProfile }) {
  const facts: Array<[string, { value: string; status: typeof profile.oneLineAssessment.status }]> = [
    ["Reactor", profile.profileHeader.reactorType],
    ["Fuel need", profile.profileHeader.fuelNeed],
    ["First fuel", profile.profileHeader.firstFuelDate],
    ["Site", profile.profileHeader.deploymentSite],
    ["Stage", profile.profileHeader.commercialStage],
  ];

  return (
    <header className="border-b border-[#d9d3c8] bg-[#f9f6ef]/90">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <BandBadge band={profile.readinessBand} />
              <EvidenceBadge status={profile.oneLineAssessment.status} />
              <span className="text-sm text-[#63615b]">Assessment {profile.assessmentDate}</span>
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#7b5b25]">{profile.companyName}</p>
            <h1 className="mt-2 max-w-4xl text-4xl font-semibold leading-[1.04] text-[#151514] sm:text-6xl">
              {profile.projectName}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#3f3d38]">{profile.oneLineAssessment.value}</p>
          </div>

          <div className="border border-[#d9d3c8] bg-[#fbfaf7] p-5">
            <div className="flex items-end justify-between border-b border-[#d9d3c8] pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#63615b]">Deployability score</p>
                <p className="mt-1 text-6xl font-semibold">{profile.readinessScore}</p>
              </div>
              <span className="pb-2 text-sm text-[#63615b]">/ 100</span>
            </div>
            <div className="mt-4 space-y-4">
              {facts.map(([label, fact]) => (
                <div key={label as string} className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#63615b]">{label as string}</span>
                    <EvidenceBadge status={fact.status} />
                  </div>
                  <p className="text-sm leading-6 text-[#292824]">{fact.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
