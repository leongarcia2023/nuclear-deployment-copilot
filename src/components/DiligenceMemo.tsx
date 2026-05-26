"use client";

import type { ProjectCounterpartyProfile } from "@/types/core";

function MemoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-3 text-base leading-7 text-[#151514]">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function readableStatus(value: string) {
  return value.replaceAll("_", " ");
}

type ChunkWithClaim = NonNullable<ProjectCounterpartyProfile["claimToIcMemo"]["evidenceLedger"]>["atomicClaims"][number]["matchedChunks"][number] & { claimText: string };

function sentenceLimit(text: string, maxSentences: number) {
  const sentences = text.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text];
  return sentences.slice(0, maxSentences).join(" ").trim();
}

function allChunks(profile: ProjectCounterpartyProfile): ChunkWithClaim[] {
  return profile.claimToIcMemo.evidenceLedger?.atomicClaims.flatMap((claim) => claim.matchedChunks.map((chunk) => ({ ...chunk, claimText: claim.text }))) ?? [];
}

function claimTypes(profile: ProjectCounterpartyProfile) {
  return new Set(profile.claimToIcMemo.detectedClaims?.map((claim) => claim.claimType) ?? []);
}

function sourceFamily(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("palisades") || lower.includes("restart")) return "restart";
  if (lower.includes("ferc") || lower.includes("susquehanna") || lower.includes("co-location") || lower.includes("colocation")) return "data_center_power";
  if (lower.includes("talen") || lower.includes("amazon") || lower.includes("constellation") || lower.includes("crane") || lower.includes("microsoft")) return "data_center_commercial";
  if (lower.includes("triso") || lower.includes("fabrication")) return "fuel_fabrication";
  if (lower.includes("transport") || lower.includes("safeguard") || lower.includes("storage")) return "fuel_logistics";
  if (lower.includes("haleu") || lower.includes("centrus") || lower.includes("american centrifuge") || lower.includes("allocation") || lower.includes("enrichment")) return "haleu";
  if (lower.includes("lic-116") || lower.includes("preapplication") || lower.includes("pre-application") || lower.includes("arcap") || lower.includes("rai") || lower.includes("nuscale") || lower.includes("long mott") || lower.includes("kemmerer") || lower.includes("construction permit")) return "licensing";
  if (lower.includes("lpo") || lower.includes("loan") || lower.includes("title 17") || lower.includes("financing")) return "financing";
  if (lower.includes("site") || lower.includes("permitting") || lower.includes("eis") || lower.includes("nepa")) return "site_permitting";
  return "general";
}

function sourceMatchesClaimFamily(chunk: ChunkWithClaim, profile: ProjectCounterpartyProfile) {
  const claims = claimTypes(profile);
  const family = sourceFamily(chunk.documentTitle);
  const layerText = chunk.deploymentLayers.join(" ").toLowerCase();
  let matches = false;

  if (claims.has("data_center_power_claim") || claims.has("behind_the_meter_claim") || claims.has("bridge_power_claim")) {
    matches ||= family === "data_center_power" || family === "data_center_commercial" || layerText.includes("interconnection") || layerText.includes("offtake");
  }
  if (claims.has("HALEU_claim") || claims.has("fuel_cycle_claim")) {
    matches ||= family === "haleu" || family === "fuel_fabrication" || family === "fuel_logistics";
  }
  if (claims.has("licensing_claim") || claims.has("NRC_engagement_claim") || claims.has("deployment_timeline_claim")) {
    matches ||= family === "licensing";
  }
  if (claims.has("site_control_claim")) {
    matches ||= family === "site_permitting" || family === "licensing" || family === "restart";
  }
  if (claims.has("offtake_claim")) {
    matches ||= layerText.includes("offtake") && family !== "haleu" && family !== "fuel_fabrication" && family !== "fuel_logistics" && family !== "data_center_power" && family !== "data_center_commercial";
  }
  if (claims.has("financing_claim")) {
    matches ||= family === "financing" || family === "restart";
  }
  if (claims.has("EPC_construction_claim")) {
    matches ||= family === "licensing" || layerText.includes("construction") || family === "restart";
  }
  return matches || family !== "general" && claims.size === 0;
}


function mainChunks(profile: ProjectCounterpartyProfile) {
  const seenDocs = new Set<string>();
  return allChunks(profile).filter((chunk) => sourceMatchesClaimFamily(chunk, profile)).filter((chunk) => {
    if (seenDocs.has(chunk.documentId)) return false;
    seenDocs.add(chunk.documentId);
    return true;
  }).slice(0, 3);
}

function sourceWhy(title: string, fallback: string) {
  const lower = title.toLowerCase();
  if (lower.includes("palisades") || lower.includes("restart")) {
    return "Useful restart, NEPA, financing, or policy precedent; it does not prove fuel allocation, new-build licensing, or target-specific project commitments.";
  }
  if (lower.includes("ferc") || lower.includes("susquehanna") || lower.includes("co-location")) {
    return "Shows that nuclear/data-center co-location can raise tariff, reliability, interconnection, and deliverability issues.";
  }
  if (lower.includes("talen") || lower.includes("amazon")) {
    return "Shows a commercial benchmark for nuclear-powered data centers, but the diligence issue remains target-specific offtake and deliverability.";
  }
  if (lower.includes("constellation") || lower.includes("crane")) {
    return "Shows that large-load nuclear power structures are commercially relevant, while still leaving site, tariff, and contract specifics to diligence.";
  }
  if (lower.includes("criticality") || lower.includes("benchmark")) return "Shows that HALEU fuel-cycle licensing depends on validated criticality and analytical data, not just material availability.";
  if (lower.includes("centrus") || lower.includes("american centrifuge")) return "Shows public precedent for HALEU enrichment/licensing activity, but not a reservation or delivery commitment for this target.";
  if (lower.includes("eis") || lower.includes("availability program") || lower.includes("allocation")) return "Shows DOE-level HALEU program context and allocation constraints; it does not identify this target as an allocated customer.";
  if (lower.includes("triso") || lower.includes("fabrication")) return "Shows that fabrication capacity and license review are separate gating items from obtaining enriched material.";
  if (lower.includes("transport") || lower.includes("safeguard") || lower.includes("storage")) return "Shows that transport, safeguards, and storage are part of fuel readiness, not administrative afterthoughts.";
  if (lower.includes("haleu")) return "Relevant HALEU context, but not proof of target-specific fuel supply, fabrication, or delivery timing.";
  if (lower.includes("lic-116") || lower.includes("preapplication")) return "Benchmarks why pre-application engagement is weaker than a docketed or accepted application.";
  if (lower.includes("nuscale") || lower.includes("rai") || lower.includes("arcap")) return "Shows the level of public NRC review detail needed before treating a deployment timeline as mature.";
  return sentenceLimit(fallback, 1);
}

function SourceEvidence({ profile }: { profile: ProjectCounterpartyProfile }) {
  const chunks = mainChunks(profile);

  if (!chunks.length) {
    return <p>No chunk-backed public evidence matched the claim. Treat the memo as unsupported until the counterparty provides evidence.</p>;
  }

  return (
    <div className="space-y-3">
      {chunks.map((chunk) => (
        <article key={chunk.chunkId} className="border border-[#d9d3c8] bg-white p-4">
          <p><span className="font-semibold">Source:</span> #{chunk.rank} {chunk.documentTitle}</p>
          <p className="mt-2"><span className="font-semibold">Why it matters:</span> {sourceWhy(chunk.documentTitle, chunk.relevanceReason)}</p>
          <p className="mt-2"><span className="font-semibold">Does not prove:</span> {sentenceLimit(chunk.doesNotProve, 1)}</p>
        </article>
      ))}
    </div>
  );
}

function conciseMissing(profile: ProjectCounterpartyProfile) {
  const memo = profile.claimToIcMemo.firstPassIcMemo;
  const ledger = profile.claimToIcMemo.evidenceLedger;
  const base = ledger?.topMissingEvidence.length ? ledger.topMissingEvidence : memo.whatIsNotYetEvidenced;
  return base.slice(0, 5);
}

function conciseVerdictChangers(profile: ProjectCounterpartyProfile) {
  const memo = profile.claimToIcMemo.firstPassIcMemo;
  const ledger = profile.claimToIcMemo.evidenceLedger;
  return (ledger?.whatWouldChangeVerdict.length ? ledger.whatWouldChangeVerdict : memo.whatMustBeTrue).slice(0, 6);
}

function conciseQuestions(profile: ProjectCounterpartyProfile) {
  return profile.claimToIcMemo.firstPassIcMemo.diligenceQuestions.slice(0, 5);
}

function analystRead(profile: ProjectCounterpartyProfile) {
  const category = profile.claimToIcMemo.analysisDebug?.companyCategory;
  const claims = profile.claimToIcMemo.detectedClaims ?? [];
  const hasDataCenterClaim = claims.some((claim) => claim.claimType === "data_center_power_claim");
  if (category === "data_center_power_infrastructure" || hasDataCenterClaim) {
    return [
      "This is not primarily a reactor diligence problem yet; it is a power-campus deliverability problem.",
      "The first question is whether the company can control sites, energize load, and contract customers before nuclear is available.",
      "Nuclear should be treated as upside optionality unless the reactor vendor, licensing owner, fuel path, EPC responsibility, and bridge-to-nuclear transition plan are evidenced.",
    ];
  }
  if (claims.some((claim) => claim.claimType === "HALEU_claim" || claim.claimType === "fuel_cycle_claim")) {
    return [
      "This is a fuel-readiness diligence problem: public HALEU context can show scarcity, licensing constraints, and precedent activity, but it does not prove this target has secured assay, form, quantity, supplier allocation, fabrication capacity, transport/safeguards arrangements, or delivery windows. Treat the claim as commercially relevant but unreserved until the counterparty provides a project-specific fuel-readiness package tied to first core, reloads, licensing milestones, and reservation authority.",
    ];
  }
  if (claims.some((claim) => claim.claimType === "financing_claim")) {
    return [
      "This is a financing-readiness diligence problem.",
      "A grant, award, or conditional commitment may validate strategic interest, but it does not equal closed project financing, satisfied conditions precedent, or a bankable capital stack.",
    ];
  }
  if (claims.some((claim) => claim.claimType === "NRC_engagement_claim" || claim.claimType === "licensing_claim" || claim.claimType === "deployment_timeline_claim")) {
    return [
      "The regulatory claim needs to be separated from the commercial-operation claim.",
      "Pre-application engagement can be useful, but it does not establish a docketed application, completed safety review, construction authority, site readiness, or operations date.",
      "Treat the timeline as unsupported until the public regulatory path and private execution milestones line up.",
    ];
  }
  if (claims.some((claim) => claim.claimType === "site_control_claim" || claim.claimType === "behind_the_meter_claim")) {
    return [
      "This is a site-control and power-delivery diligence problem.",
      "A named site, brownfield narrative, or behind-the-meter claim is useful context, but it does not prove land rights, interconnection rights, permits, tariff treatment, or an islanded operating basis.",
    ];
  }
  if (claims.some((claim) => claim.claimType === "offtake_claim")) {
    return [
      "This is a commercial commitment diligence problem.",
      "Customer interest, an LOI, or an MOU can justify a call, but it is not the same as a binding PPA, credit support, termination rights, or a financeable offtake package.",
    ];
  }
  if (claims.some((claim) => claim.claimType === "EPC_construction_claim")) {
    return [
      "This is an EPC and construction-risk diligence problem.",
      "A selected partner or factory-built narrative does not resolve scope, price, schedule, liquidated damages, FOAK risk, or who carries cost-overrun exposure.",
    ];
  }
  return [
    "This claim is not yet underwritable because the target has not provided enough project-specific evidence to distinguish a serious deployment path from an early-stage commercial narrative.",
  ];
}

function coverageSummary(profile: ProjectCounterpartyProfile) {
  const coverage = profile.claimToIcMemo.evidenceLedger?.deploymentLayerSummary ?? profile.claimToIcMemo.documentCoverage ?? [];
  const hasFuelClaim = profile.claimToIcMemo.detectedClaims?.some((claim) => claim.claimType === "HALEU_claim" || claim.claimType === "fuel_cycle_claim");
  const hasDataCenterClaim = profile.claimToIcMemo.detectedClaims?.some((claim) => claim.claimType === "data_center_power_claim");

  if (hasFuelClaim && !hasDataCenterClaim) {
    return [
      "Strong corpus context: DOE/NRC HALEU materials, enrichment precedent, fuel-cycle facility licensing, fabrication review, and transport/safeguards context.",
      "Missing target-specific proof: assay, form, quantity, first-core and reload schedule, named supplier or allocation, delivery window, and fallback if supply slips.",
      "Private diligence required: capacity reservation terms, fabrication slot, commercial credit support, transport/safeguards owner, and milestone-linked cancellation rights.",
    ];
  }

  const strong = coverage
    .filter((item) => item.corpusCoverage === "Strong" || item.corpusCoverage === "Partial")
    .map((item) => item.layer)
    .slice(0, 4);
  const missing = coverage
    .filter((item) => item.targetSpecificSupport === "Missing" || item.targetSpecificSupport === "Partially supported")
    .map((item) => item.layer)
    .slice(0, 7);
  const privateItems = coverage
    .filter((item) => item.targetSpecificSupport === "Private diligence required" || item.targetSpecificSupport === "Cannot know from public docs")
    .map((item) => item.layer)
    .slice(0, 5);

  return [
    `Strong corpus context: ${strong.length ? strong.join(", ") : "none in current seed corpus"}.`,
    `Missing target-specific support: ${missing.length ? missing.join(", ") : "none flagged"}.`,
    `Private diligence required: ${privateItems.length ? privateItems.join(", ") : "binding contracts, pricing, EPC terms, customer credit, and capital stack where applicable"}.`,
  ];
}

function AtomicClaims({ profile }: { profile: ProjectCounterpartyProfile }) {
  const claims = profile.claimToIcMemo.evidenceLedger?.atomicClaims ?? [];
  if (!claims.length) return <p>No atomic claims were extracted from the current note.</p>;
  return (
    <div className="space-y-3">
      {claims.map((claim) => (
        <article key={claim.id} className="border border-[#d9d3c8] bg-white p-4">
          <h3 className="text-lg font-semibold leading-7">{claim.text}</h3>
          <p className="mt-2 text-base leading-7"><span className="font-semibold">Evidence status:</span> {readableStatus(claim.evidenceStatus)}</p>
          <p className="mt-2 text-base leading-7 text-[#63615b]">Layers: {claim.deploymentLayers.join(", ") || "Unclear"}</p>
        </article>
      ))}
    </div>
  );
}

function EvidenceLedgerView({ profile }: { profile: ProjectCounterpartyProfile }) {
  const claims = profile.claimToIcMemo.evidenceLedger?.atomicClaims ?? [];
  if (!claims.length) return <p>No evidence ledger generated.</p>;
  return (
    <div className="space-y-3">
      {claims.map((claim) => (
        <article key={`ledger-${claim.id}`} className="border border-[#d9d3c8] bg-white p-4">
          <h3 className="text-lg font-semibold leading-7">{claim.text}</h3>
          <p className="mt-2 text-base leading-7"><span className="font-semibold">Evidence status:</span> {readableStatus(claim.evidenceStatus)} · Confidence: {claim.confidence}</p>
          <p className="mt-2 text-base leading-7 text-[#63615b]"><span className="font-semibold">Required evidence:</span> {claim.requiredEvidence}</p>
          <p className="mt-2 text-base leading-7 text-[#63615b]"><span className="font-semibold">Does not prove:</span> {claim.whatThisDoesNotProve}</p>
        </article>
      ))}
    </div>
  );
}

function EvidenceCoverageList({ profile }: { profile: ProjectCounterpartyProfile }) {
  const coverage = profile.claimToIcMemo.evidenceLedger?.deploymentLayerSummary ?? profile.claimToIcMemo.documentCoverage ?? [];
  if (!coverage.length) return <p>No deployment-layer coverage generated.</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {coverage.map((item) => (
        <article key={item.layer} className="border border-[#d9d3c8] bg-white p-4">
          <h3 className="text-lg font-semibold leading-7">{item.layer}</h3>
          <p className="mt-2 text-base leading-7"><span className="font-semibold">Corpus coverage:</span> {item.corpusCoverage}</p>
          <p className="mt-1 text-base leading-7"><span className="font-semibold">Target-specific support:</span> {item.targetSpecificSupport}</p>
          <p className="mt-2 text-base leading-7 text-[#63615b]">{item.conclusion}</p>
        </article>
      ))}
    </div>
  );
}

function AllChunks({ profile }: { profile: ProjectCounterpartyProfile }) {
  const chunks = allChunks(profile).filter((chunk, index, array) => array.findIndex((item) => item.chunkId === chunk.chunkId) === index);
  if (!chunks.length) return <p>No matched chunks.</p>;
  return (
    <div className="space-y-3">
      {chunks.map((chunk) => (
        <article key={chunk.chunkId} className="border border-[#d9d3c8] bg-white p-4">
          <h3 className="text-lg font-semibold leading-7">#{chunk.rank} {chunk.documentTitle}</h3>
          <p className="mt-2 text-base leading-7">{sentenceLimit(chunk.excerpt, 3)}</p>
          <p className="mt-2 text-base leading-7 text-[#63615b]"><span className="font-semibold">Related claim:</span> {chunk.claimText}</p>
          <p className="mt-2 text-base leading-7 text-[#63615b]"><span className="font-semibold">Does not prove:</span> {chunk.doesNotProve}</p>
        </article>
      ))}
    </div>
  );
}

function ManifestOnlyDocuments({ profile }: { profile: ProjectCounterpartyProfile }) {
  const docs = profile.claimToIcMemo.manifestOnlyDocuments ?? [];
  if (!docs.length) return <p>No manifest-only documents matched.</p>;
  return (
    <div className="space-y-3">
      {docs.map((document) => (
        <article key={document.rank} className="border border-[#d9d3c8] bg-white p-4">
          <h3 className="text-lg font-semibold leading-7">#{document.rank} {document.title}</h3>
          <p className="mt-2 text-base leading-7 text-[#63615b]">{document.whyItMatters}</p>
        </article>
      ))}
    </div>
  );
}

function DebugDetails({ profile }: { profile: ProjectCounterpartyProfile }) {
  const debug = profile.claimToIcMemo.analysisDebug;
  if (!debug) return <p>No debug details available.</p>;
  return (
    <div className="grid gap-3 text-base leading-7">
      <p><span className="font-semibold">Detected company profile:</span> {debug.detectedCompanyProfile ?? "No curated match"}</p>
      <p><span className="font-semibold">Company category:</span> {debug.companyCategory}</p>
      <p><span className="font-semibold">Detected claim types:</span> {debug.detectedClaimTypes.join(", ") || "None"}</p>
      <p><span className="font-semibold">Deployment layers implicated:</span> {debug.deploymentLayersImplicated.join(", ") || "None"}</p>
      <p><span className="font-semibold">Selected memo template:</span> {debug.selectedMemoTemplate}</p>
      <pre className="overflow-auto border border-[#d9d3c8] bg-[#fbfaf7] p-3 text-sm leading-6">{JSON.stringify(debug.triggeredKeywords, null, 2)}</pre>
    </div>
  );
}

function AppendixSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="border border-[#d9d3c8] bg-white p-4">
      <summary className="cursor-pointer text-lg font-semibold text-[#255d82]">{title}</summary>
      <div className="mt-4 text-base leading-7 text-[#151514]">{children}</div>
    </details>
  );
}

function AnalysisAppendix({ profile }: { profile: ProjectCounterpartyProfile }) {
  return (
    <section className="space-y-3 border-t border-[#d9d3c8] pt-6">
      <h2 className="text-2xl font-semibold">Analysis appendix</h2>
      <AppendixSection title="Atomic claims"><AtomicClaims profile={profile} /></AppendixSection>
      <AppendixSection title="Evidence ledger"><EvidenceLedgerView profile={profile} /></AppendixSection>
      <AppendixSection title="Full deployment-layer coverage"><EvidenceCoverageList profile={profile} /></AppendixSection>
      <AppendixSection title="All matched chunks"><AllChunks profile={profile} /></AppendixSection>
      <AppendixSection title="Manifest-only documents"><ManifestOnlyDocuments profile={profile} /></AppendixSection>
      <AppendixSection title="Analysis/debug details"><DebugDetails profile={profile} /></AppendixSection>
    </section>
  );
}

export function DiligenceMemo({ profile }: { profile: ProjectCounterpartyProfile }) {
  const memo = profile.claimToIcMemo.firstPassIcMemo;
  const executiveSummary = sentenceLimit(memo.thesis || profile.claimToIcMemo.oneLineJudgment, 3);

  return (
    <article className="border border-[#d9d3c8] bg-[#fbfaf7] p-6 sm:p-8">
      <div className="space-y-8">
        <MemoSection title="Analyst read">
          <div className="space-y-3">
            {analystRead(profile).slice(0, 5).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </MemoSection>

        <MemoSection title="Executive Summary">
          <p>{executiveSummary}</p>
        </MemoSection>

        <MemoSection title="Top missing evidence">
          <Bullets items={conciseMissing(profile)} />
        </MemoSection>

        <MemoSection title="Evidence coverage">
          <Bullets items={coverageSummary(profile)} />
        </MemoSection>

        <MemoSection title="Relevant public evidence">
          <SourceEvidence profile={profile} />
        </MemoSection>

        <MemoSection title="What would change the verdict">
          <Bullets items={conciseVerdictChangers(profile)} />
        </MemoSection>

        <MemoSection title="Diligence questions">
          <ol className="space-y-3">
            {conciseQuestions(profile).map((question, index) => (
              <li key={question} className="grid grid-cols-[2rem_1fr] gap-3">
                <span className="font-semibold text-[#151514]">{index + 1}.</span>
                <span>{question}</span>
              </li>
            ))}
          </ol>
        </MemoSection>

        <MemoSection title="Recommended next step">
          <p>{sentenceLimit(memo.recommendedNextStep, 2)}</p>
        </MemoSection>

        <AnalysisAppendix profile={profile} />
      </div>
    </article>
  );
}
