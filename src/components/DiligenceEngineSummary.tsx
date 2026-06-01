import type { AtomicClaim, MemoDocumentCoverageItem, ProjectCounterpartyProfile } from "@/types/core";

const deploymentRows = [
  { label: "NRC / licensing", match: ["licensing", "nrc"] },
  { label: "HALEU / fuel", match: ["haleu", "fuel supply"] },
  { label: "Fuel fabrication", match: ["fuel fabrication"] },
  { label: "Transportation / safeguards", match: ["transportation", "safeguards"] },
  { label: "Site control / permitting", match: ["site", "permitting"] },
  { label: "Interconnection / power delivery", match: ["interconnection", "power delivery"] },
  { label: "Bridge power", match: ["bridge power", "phased energization"] },
  { label: "Offtake / customer", match: ["offtake", "customer"] },
  { label: "EPC / construction", match: ["epc", "construction"] },
  { label: "Financing", match: ["financing"] },
  { label: "Operations / waste", match: ["operations", "waste"] },
];

function coverageItems(profile: ProjectCounterpartyProfile) {
  return profile.claimToIcMemo.evidenceLedger?.deploymentLayerSummary ?? profile.claimToIcMemo.documentCoverage ?? [];
}

function findCoverage(rows: MemoDocumentCoverageItem[], matchers: string[]) {
  return rows.find((row) => {
    const layer = row.layer.toLowerCase();
    return matchers.some((matcher) => layer.includes(matcher));
  });
}

function toneForSupport(status: MemoDocumentCoverageItem["targetSpecificSupport"] | undefined) {
  if (status === "Supported") return "bg-[#e8f0e8] text-[#1f4b2c] border-[#aec6ae]";
  if (status === "Partially supported") return "bg-[#f5ead7] text-[#7b4d17] border-[#d2b27f]";
  if (status === "Private diligence required") return "bg-[#f3e7e1] text-[#7a321f] border-[#d7ad9f]";
  if (status === "Cannot know from public docs") return "bg-[#eee9df] text-[#4a4842] border-[#c8bfae]";
  return "bg-[#f6e3de] text-[#7a231e] border-[#d6aaa0]";
}

function corpusTone(status: MemoDocumentCoverageItem["corpusCoverage"] | undefined) {
  if (status === "Strong") return "text-[#1f4b2c]";
  if (status === "Partial") return "text-[#7b5b25]";
  if (status === "Thin") return "text-[#7a4a1f]";
  return "text-[#7a231e]";
}

function implication(row?: MemoDocumentCoverageItem) {
  if (!row) return "No layer-specific corpus match in current seed set.";
  if (row.targetSpecificSupport === "Supported") return "Target proof visible";
  if (row.targetSpecificSupport === "Partially supported") return "Needs corroboration";
  if (row.targetSpecificSupport === "Private diligence required") return "Private diligence gate";
  if (row.targetSpecificSupport === "Cannot know from public docs") return "Cannot verify publicly";
  if (row.corpusCoverage === "Strong") return "High diligence risk";
  if (row.corpusCoverage === "Partial") return "Evidence gap";
  return "Unsupported in current record";
}

function friendlyClaimType(claimType: string) {
  const labels: Record<string, string> = {
    data_center_power_claim: "Data center power campus claim",
    behind_the_meter_claim: "Behind-the-meter claim",
    bridge_power_claim: "Bridge power claim",
    nuclear_integration_claim: "Nuclear integration claim",
    fuel_cycle_claim: "Fuel-cycle claim",
    HALEU_claim: "HALEU / first core claim",
    licensing_claim: "NRC / licensing claim",
    NRC_engagement_claim: "NRC engagement claim",
    deployment_timeline_claim: "Timeline claim",
    offtake_claim: "MOU / offtake claim",
    site_control_claim: "Site control claim",
    financing_claim: "DOE award / financing claim",
    EPC_construction_claim: "EPC readiness claim",
  };
  return labels[claimType] ?? claimType.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function friendlyEvidenceStatus(status: AtomicClaim["evidenceStatus"]) {
  const labels: Record<AtomicClaim["evidenceStatus"], string> = {
    supported_by_public_source: "supported",
    partially_supported_by_public_source: "partially supported",
    user_note_only: "user note only",
    inferred: "inferred",
    missing: "missing",
    private_diligence_required: "private diligence required",
    cannot_know_from_public_docs: "cannot know",
  };
  return labels[status];
}

function chipTone(status: AtomicClaim["evidenceStatus"]) {
  if (status === "supported_by_public_source") return "border-[#aec6ae] bg-[#e8f0e8]";
  if (status === "partially_supported_by_public_source" || status === "user_note_only" || status === "inferred") return "border-[#d2b27f] bg-[#f5ead7]";
  return "border-[#d6aaa0] bg-[#f6e3de]";
}

function layerForClaim(claim: AtomicClaim) {
  return claim.deploymentLayers[0] ?? "Deployment evidence";
}

function priorityCoverage(rows: MemoDocumentCoverageItem[]) {
  const priority = rows
    .filter((row) => row.corpusCoverage === "Strong" || row.corpusCoverage === "Partial" || row.targetSpecificSupport !== "Supported")
    .sort((a, b) => {
      const riskRank = (row: MemoDocumentCoverageItem) => {
        if (row.targetSpecificSupport === "Missing") return 0;
        if (row.targetSpecificSupport === "Private diligence required") return 1;
        if (row.targetSpecificSupport === "Cannot know from public docs") return 2;
        if (row.targetSpecificSupport === "Partially supported") return 3;
        return 4;
      };
      return riskRank(a) - riskRank(b);
    });
  return priority.slice(0, 4);
}

function interpretation(row: MemoDocumentCoverageItem) {
  const layer = row.layer.toLowerCase();
  if (layer.includes("haleu") || layer.includes("fuel supply")) {
    return "Public fuel-cycle context does not prove this target has secured fuel, fabrication, or delivery commitments.";
  }
  if (layer.includes("offtake") || layer.includes("customer")) {
    return "Customer interest or an MOU is not binding offtake without contract terms, credit support, and termination rights.";
  }
  if (layer.includes("licensing") || layer.includes("nrc")) {
    return "Public NRC context helps frame maturity, but it does not prove a target-specific docket, approval, or operations date.";
  }
  if (layer.includes("site") || layer.includes("interconnection") || layer.includes("power delivery")) {
    return "General precedent does not prove site rights, interconnection rights, tariff treatment, or an islanded operating basis.";
  }
  if (layer.includes("financing")) {
    return "Public funding signals do not equal closed equity, debt, or satisfied financing conditions.";
  }
  if (layer.includes("epc") || layer.includes("construction")) {
    return "Construction precedent does not prove this target has a bankable EPC scope, cost basis, or risk allocation.";
  }
  return row.conclusion;
}

function Matrix({ profile }: { profile: ProjectCounterpartyProfile }) {
  const rows = coverageItems(profile);
  return (
    <section className="border border-[#d9d3c8] bg-[#fbfaf7] p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7b5b25]">Deployment stack matrix</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#151514]">Public context vs target proof</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-[#4a4842]">A compact read on where the corpus has useful precedent and where the target still needs project-specific evidence.</p>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="border-b border-[#d9d3c8] text-[#4a4842]">
            <tr>
              <th className="py-2 pr-4 font-semibold">Layer</th>
              <th className="px-4 py-2 font-semibold">Public corpus context</th>
              <th className="px-4 py-2 font-semibold">Target-specific proof</th>
              <th className="py-2 pl-4 font-semibold">Status / implication</th>
            </tr>
          </thead>
          <tbody>
            {deploymentRows.map((item) => {
              const row = findCoverage(rows, item.match);
              return (
                <tr key={item.label} className="border-b border-[#e4ded3] last:border-0">
                  <td className="py-2 pr-4 font-semibold text-[#151514]">{item.label}</td>
                  <td className={`px-4 py-2 font-semibold ${corpusTone(row?.corpusCoverage)}`}>{row?.corpusCoverage ?? "Missing"}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex border px-2 py-1 text-xs font-semibold ${toneForSupport(row?.targetSpecificSupport)}`}>{row?.targetSpecificSupport ?? "Missing"}</span>
                  </td>
                  <td className="py-2 pl-4 text-[#4a4842]">{implication(row)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AtomicClaims({ profile }: { profile: ProjectCounterpartyProfile }) {
  const claims = profile.claimToIcMemo.evidenceLedger?.atomicClaims ?? [];
  const compact = claims.slice(0, 8);
  if (!compact.length) return null;
  return (
    <section className="border border-[#d9d3c8] bg-[#fbfaf7] p-5">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7b5b25]">Atomic claims detected</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {compact.map((claim) => (
          <article key={claim.id} className={`border p-3 ${chipTone(claim.evidenceStatus)}`}>
            <h3 className="text-base font-semibold leading-6 text-[#151514]">{friendlyClaimType(claim.claimType)}</h3>
            <p className="mt-2 text-sm leading-5 text-[#4a4842]">{layerForClaim(claim)}</p>
            <p className="mt-2 text-sm font-semibold text-[#151514]">{friendlyEvidenceStatus(claim.evidenceStatus)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ContextProofCards({ profile }: { profile: ProjectCounterpartyProfile }) {
  const rows = priorityCoverage(coverageItems(profile));
  if (!rows.length) return null;
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {rows.map((row) => (
        <article key={row.layer} className="border border-[#d9d3c8] bg-white p-5">
          <h3 className="text-xl font-semibold text-[#151514]">{row.layer}</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <p className="border border-[#d9d3c8] bg-[#fbfaf7] p-3 text-base leading-6"><span className="block text-sm font-semibold text-[#7b5b25]">Public corpus</span>{row.corpusCoverage}</p>
            <p className="border border-[#d9d3c8] bg-[#fbfaf7] p-3 text-base leading-6"><span className="block text-sm font-semibold text-[#7b5b25]">Target proof</span>{row.targetSpecificSupport}</p>
          </div>
          <p className="mt-4 text-base leading-7 text-[#151514]"><span className="font-semibold">Interpretation:</span> {interpretation(row)}</p>
        </article>
      ))}
    </section>
  );
}

function VerdictChecklist({ profile }: { profile: ProjectCounterpartyProfile }) {
  const items = (profile.claimToIcMemo.evidenceLedger?.whatWouldChangeVerdict.length
    ? profile.claimToIcMemo.evidenceLedger.whatWouldChangeVerdict
    : profile.claimToIcMemo.firstPassIcMemo.whatMustBeTrue).slice(0, 6);
  if (!items.length) return null;
  return (
    <section className="border border-[#d9d3c8] bg-[#fbfaf7] p-5">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#7b5b25]">What would change the verdict</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div key={item} className="flex gap-3 border border-[#d9d3c8] bg-white p-3 text-base leading-6 text-[#151514]">
            <span aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 border border-[#7b5b25] bg-[#fbfaf7]" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DiligenceEngineSummary({ profile }: { profile: ProjectCounterpartyProfile }) {
  return (
    <section className="mt-6 space-y-5">
      <AtomicClaims profile={profile} />
      <ContextProofCards profile={profile} />
      <Matrix profile={profile} />
      <VerdictChecklist profile={profile} />
    </section>
  );
}
