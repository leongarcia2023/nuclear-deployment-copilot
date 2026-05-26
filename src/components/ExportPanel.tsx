"use client";

import { useRef, useState } from "react";
import { Check, Clipboard, ListChecks } from "lucide-react";
import { copyToClipboard } from "@/lib/clipboard/copyToClipboard";
import type { DeploymentLayerFinding, DetectedClaim, FirstPassIcMemo, EvidenceLedger, MemoDocumentCoverageItem, MemoRelevantDocument, MemoSourceCoverage, ProjectCounterpartyProfile, PublicEvidenceNote } from "@/types/core";

function list(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

export function icMemoMarkdown(
  memo: FirstPassIcMemo,
  publicEvidenceNotes: PublicEvidenceNote[] = [],
  sourceCoverage: MemoSourceCoverage = [],
  detectedClaims: DetectedClaim[] = [],
  layerFindings: DeploymentLayerFinding[] = [],
  documentCoverage: MemoDocumentCoverageItem[] = [],
  relevantDocuments: MemoRelevantDocument[] = [],
  evidenceLedger?: EvidenceLedger,
) {
  const missingNotes = evidenceLedger?.topMissingEvidence.length
    ? list(evidenceLedger.topMissingEvidence.slice(0, 5))
    : list((memo.whatIsNotYetEvidenced.length ? memo.whatIsNotYetEvidenced : layerFindings.map((item) => item.requiredEvidence)).slice(0, 5));
  const verdictChangeNotes = evidenceLedger?.whatWouldChangeVerdict.length
    ? list(evidenceLedger.whatWouldChangeVerdict.slice(0, 6))
    : list(memo.whatMustBeTrue.slice(0, 6));
  const coverageNotes = conciseCoverageNotes(evidenceLedger?.deploymentLayerSummary ?? documentCoverage, detectedClaims);
  const chunkNotes = evidenceLedger?.atomicClaims.flatMap((claim) => claim.matchedChunks) ?? [];
  const conciseEvidence = concisePublicEvidence(chunkNotes, detectedClaims);
  const prioritizedNotes = prioritizedPublicEvidenceNotes(memo.target, publicEvidenceNotes, detectedClaims);
  const publicEvidence = conciseEvidence.length
    ? list(conciseEvidence)
    : prioritizedNotes.length
      ? list(prioritizedNotes.map((note) => `${note.title}: ${note.whyItMatters || note.relevance}`))
      : "- No concrete chunk-backed public evidence matched the claim.";
  const analystNotes = analystRead(memo, detectedClaims).slice(0, 5).join("\n\n");

  return `# First-Pass IC Memo

Target: ${memo.target}
User type: ${memo.userType ?? "Not specified"}
Decision question: ${memo.decision}
Verdict: ${memo.verdict}
Confidence: ${memo.confidence}

## One-line judgment
${memo.thesis}

## Analyst read
${analystNotes}

## Top missing evidence
${missingNotes}

## Evidence coverage
${list(coverageNotes)}

## Relevant public evidence
${publicEvidence}

## What would change the verdict
${verdictChangeNotes}

## Diligence questions
${list(memo.diligenceQuestions.slice(0, 5))}

## Recommended next step
${memo.recommendedNextStep}
`;
}


function prioritizedPublicEvidenceNotes(target: string, notes: PublicEvidenceNote[], detectedClaims: DetectedClaim[]) {
  const targetTerms = target.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 3);
  const claimTypes = new Set(detectedClaims.map((claim) => claim.claimType));
  return [...notes]
    .filter((note) => {
      const title = note.title.toLowerCase();
      if (title.includes("placeholder") || title.includes("public company investor materials / filings")) return false;
      if ((claimTypes.has("HALEU_claim") || claimTypes.has("fuel_cycle_claim")) && (title.includes("palisades") || title.includes("ferc") || title.includes("talen") || title.includes("constellation"))) return false;
      if ((claimTypes.has("data_center_power_claim") || claimTypes.has("behind_the_meter_claim") || claimTypes.has("bridge_power_claim")) && (title.includes("haleu") || title.includes("triso") || title.includes("centrus"))) return false;
      return true;
    })
    .sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const aTarget = targetTerms.some((term) => aTitle.includes(term)) ? 1 : 0;
      const bTarget = targetTerms.some((term) => bTitle.includes(term)) ? 1 : 0;
      return bTarget - aTarget;
    })
    .slice(claimTypes.has("financing_claim") && claimTypes.size <= 2 ? 0 : 0, claimTypes.has("financing_claim") && claimTypes.size <= 2 ? 2 : 3);
}

function conciseCoverageNotes(coverage: MemoDocumentCoverageItem[], detectedClaims: DetectedClaim[] = []) {
  const claimTypes = new Set(detectedClaims.map((claim) => claim.claimType));
  if ((claimTypes.has("HALEU_claim") || claimTypes.has("fuel_cycle_claim")) && !claimTypes.has("data_center_power_claim")) {
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

function sourceMatchesClaimFamily(chunk: EvidenceLedger["atomicClaims"][number]["matchedChunks"][number], detectedClaims: DetectedClaim[]) {
  const claimTypes = new Set(detectedClaims.map((claim) => claim.claimType));
  const family = sourceFamily(chunk.documentTitle);
  const layerText = chunk.deploymentLayers.join(" ").toLowerCase();
  let matches = false;

  if (claimTypes.has("data_center_power_claim") || claimTypes.has("behind_the_meter_claim") || claimTypes.has("bridge_power_claim")) {
    matches ||= family === "data_center_power" || family === "data_center_commercial" || layerText.includes("interconnection") || layerText.includes("offtake");
  }
  if (claimTypes.has("HALEU_claim") || claimTypes.has("fuel_cycle_claim")) {
    matches ||= family === "haleu" || family === "fuel_fabrication" || family === "fuel_logistics";
  }
  if (claimTypes.has("licensing_claim") || claimTypes.has("NRC_engagement_claim") || claimTypes.has("deployment_timeline_claim")) {
    matches ||= family === "licensing";
  }
  if (claimTypes.has("site_control_claim")) {
    matches ||= family === "site_permitting" || family === "licensing" || family === "restart";
  }
  if (claimTypes.has("offtake_claim")) {
    matches ||= layerText.includes("offtake") && family !== "haleu" && family !== "fuel_fabrication" && family !== "fuel_logistics" && family !== "data_center_power" && family !== "data_center_commercial";
  }
  if (claimTypes.has("financing_claim")) {
    matches ||= family === "financing" || family === "restart";
  }
  if (claimTypes.has("EPC_construction_claim")) {
    matches ||= family === "licensing" || layerText.includes("construction") || family === "restart";
  }
  return matches || family !== "general" && claimTypes.size === 0;
}


function sourceWhy(title: string, fallback: string) {
  const lower = title.toLowerCase();
  if (lower.includes("palisades") || lower.includes("restart")) return "Useful restart, NEPA, financing, or policy precedent; it does not prove fuel allocation, new-build licensing, or target-specific project commitments.";
  if (lower.includes("ferc") || lower.includes("susquehanna") || lower.includes("co-location")) return "Shows that nuclear/data-center co-location can raise tariff, reliability, interconnection, and deliverability issues.";
  if (lower.includes("talen") || lower.includes("amazon")) return "Shows a commercial benchmark for nuclear-powered data centers, but the diligence issue remains target-specific offtake and deliverability.";
  if (lower.includes("constellation") || lower.includes("crane")) return "Shows that large-load nuclear power structures are commercially relevant, while still leaving site, tariff, and contract specifics to diligence.";
  if (lower.includes("criticality") || lower.includes("benchmark")) return "Shows that HALEU fuel-cycle licensing depends on validated criticality and analytical data, not just material availability.";
  if (lower.includes("centrus") || lower.includes("american centrifuge")) return "Shows public precedent for HALEU enrichment/licensing activity, but not a reservation or delivery commitment for this target.";
  if (lower.includes("availability program") || lower.includes("allocation")) return "Shows DOE-level HALEU program context and allocation constraints; it does not identify this target as an allocated customer.";
  if (lower.includes("eis") || lower.includes("nepa")) return "Useful NEPA, site, or environmental-review context, but not proof of target-specific permits, interconnection rights, or financing.";
  if (lower.includes("triso") || lower.includes("fabrication")) return "Shows that fabrication capacity and license review are separate gating items from obtaining enriched material.";
  if (lower.includes("transport") || lower.includes("safeguard") || lower.includes("storage")) return "Shows that transport, safeguards, and storage are part of fuel readiness, not administrative afterthoughts.";
  if (lower.includes("haleu")) return "Relevant HALEU context, but not proof of target-specific fuel supply, fabrication, or delivery timing.";
  if (lower.includes("lic-116") || lower.includes("preapplication")) return "Benchmarks why pre-application engagement is weaker than a docketed or accepted application.";
  if (lower.includes("nuscale") || lower.includes("rai") || lower.includes("arcap")) return "Shows the level of public NRC review detail needed before treating a deployment timeline as mature.";
  return firstSentence(fallback);
}

function analystRead(memo: FirstPassIcMemo, detectedClaims: DetectedClaim[]) {
  const claimTypes = new Set(detectedClaims.map((claim) => claim.claimType));
  const decision = memo.decision.toLowerCase();
  if (decision.includes("timeline") || decision.includes("believable")) {
    return [
      "The regulatory claim and execution timeline need to be separated from the commercial-operation claim.",
      "Pre-application engagement can be useful, but supplier discussions or schedule targets do not establish a docketed application, secured fuel, site readiness, EPC execution, financing, or operations date.",
      "Treat the timeline as unsupported until the public regulatory path and private execution milestones line up.",
    ];
  }
  if (claimTypes.has("data_center_power_claim") || claimTypes.has("behind_the_meter_claim") || claimTypes.has("bridge_power_claim")) {
    return [
      "This is not primarily a reactor diligence problem yet; it is a power-campus deliverability problem.",
      "The first question is whether the company can control sites, energize load, and contract customers before nuclear is available.",
      "Nuclear should be treated as upside optionality unless the reactor vendor, licensing owner, fuel path, EPC responsibility, and bridge-to-nuclear transition plan are evidenced.",
    ];
  }
  if (claimTypes.has("HALEU_claim") || claimTypes.has("fuel_cycle_claim")) {
    return [
      "This is a fuel-readiness diligence problem: public HALEU context can show scarcity, licensing constraints, and precedent activity, but it does not prove this target has secured assay, form, quantity, supplier allocation, fabrication capacity, transport/safeguards arrangements, or delivery windows. Treat the claim as commercially relevant but unreserved until the counterparty provides a project-specific fuel-readiness package tied to first core, reloads, licensing milestones, and reservation authority.",
    ];
  }
  if (claimTypes.has("financing_claim")) {
    return [
      "This is a financing-readiness diligence problem.",
      "A grant, award, or conditional commitment may validate strategic interest, but it does not equal closed project financing, satisfied conditions precedent, or a bankable capital stack.",
    ];
  }
  if (claimTypes.has("NRC_engagement_claim") || claimTypes.has("licensing_claim") || claimTypes.has("deployment_timeline_claim")) {
    return [
      "The regulatory claim needs to be separated from the commercial-operation claim.",
      "Pre-application engagement can be useful, but it does not establish a docketed application, completed safety review, construction authority, site readiness, or operations date.",
      "Treat the timeline as unsupported until the public regulatory path and private execution milestones line up.",
    ];
  }
  if (claimTypes.has("site_control_claim") || claimTypes.has("behind_the_meter_claim")) {
    return [
      "This is a site-control and power-delivery diligence problem.",
      "A named site, brownfield narrative, or behind-the-meter claim is useful context, but it does not prove land rights, interconnection rights, permits, tariff treatment, or an islanded operating basis.",
    ];
  }
  if (claimTypes.has("offtake_claim")) {
    return [
      "This is a commercial commitment diligence problem.",
      "Customer interest, an LOI, or an MOU can justify a call, but it is not the same as a binding PPA, credit support, termination rights, or a financeable offtake package.",
    ];
  }
  if (claimTypes.has("EPC_construction_claim")) {
    return [
      "This is an EPC and construction-risk diligence problem.",
      "A selected partner or factory-built narrative does not resolve scope, price, schedule, liquidated damages, FOAK risk, or who carries cost-overrun exposure.",
    ];
  }
  return [
    "This claim is not yet underwritable because the target has not provided enough project-specific evidence to distinguish a serious deployment path from an early-stage commercial narrative.",
  ];
}


function chunkSourcePriority(title: string, claims: Set<string>, decision = "") {
  const family = sourceFamily(title);
  const explicitTimelineDecision = decision.toLowerCase().includes("timeline") || decision.toLowerCase().includes("believable");
  const hasDataCenterClaim = claims.has("data_center_power_claim") || claims.has("behind_the_meter_claim") || claims.has("bridge_power_claim");
  if (hasDataCenterClaim && !explicitTimelineDecision && (family === "data_center_power" || family === "data_center_commercial")) return 0;
  const timelineFirst = explicitTimelineDecision || claims.has("deployment_timeline_claim") || claims.has("NRC_engagement_claim") || claims.has("licensing_claim");
  if (timelineFirst && family === "licensing") return 0;
  if ((claims.has("HALEU_claim") || claims.has("fuel_cycle_claim")) && (family === "haleu" || family === "fuel_fabrication" || family === "fuel_logistics")) return 1;
  if (hasDataCenterClaim && (family === "data_center_power" || family === "data_center_commercial")) return 1;
  if (claims.has("financing_claim") && (family === "financing" || family === "restart")) return 1;
  return 5;
}

function concisePublicEvidence(chunks: EvidenceLedger["atomicClaims"][number]["matchedChunks"], detectedClaims: DetectedClaim[] = []) {
  const seenDocs = new Set<string>();
  const claimTypes = new Set(detectedClaims.map((claim) => claim.claimType));
  const limit = claimTypes.has("financing_claim") && claimTypes.size <= 2 ? 2 : 3;
  return chunks
    .filter((chunk) => sourceMatchesClaimFamily(chunk, detectedClaims))
    .sort((a, b) => chunkSourcePriority(a.documentTitle, claimTypes) - chunkSourcePriority(b.documentTitle, claimTypes))
    .filter((chunk) => {
      if (seenDocs.has(chunk.documentId)) return false;
      seenDocs.add(chunk.documentId);
      return true;
    }).slice(0, limit).map((chunk) => `Source: #${chunk.rank} ${chunk.documentTitle}. Why it matters: ${sourceWhy(chunk.documentTitle, chunk.relevanceReason)} Does not prove: ${firstSentence(chunk.doesNotProve)}`);
}

function firstSentence(value: string) {
  return (value.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [value])[0].trim();
}

function CopyBlock({
  title,
  description,
  value,
  buttonLabel,
  icon,
}: {
  title: string;
  description: string;
  value: string;
  buttonLabel: string;
  icon: React.ReactNode;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");

  async function handleCopy() {
    const copied = await copyToClipboard(value, textareaRef.current);
    setStatus(copied ? "copied" : "manual");
    window.setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <section className="border border-[#d9d3c8] bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="mt-2 text-base leading-7 text-[#151514]">{description}</p>
        </div>
        <button type="button" className="inline-flex shrink-0 items-center justify-center gap-2 bg-[#151514] px-5 py-3 text-base font-semibold text-white" style={{ color: "#ffffff" }} onClick={handleCopy}>
          {status === "copied" ? <Check className="h-5 w-5" /> : icon}
          {status === "copied" ? "Copied" : buttonLabel}
        </button>
      </div>
      {status === "manual" ? <p className="mt-3 text-base font-semibold text-[#9a3e33]">Copy was blocked by the browser. The text is selected below so you can press Cmd+C.</p> : null}
      <textarea
        ref={textareaRef}
        className="mt-4 h-80 w-full resize-y border border-[#d9d3c8] bg-[#fbfaf7] p-4 font-mono text-sm leading-6 text-[#151514] outline-none focus:border-[#151514]"
        readOnly
        value={value}
        onFocus={(event) => event.currentTarget.select()}
      />
    </section>
  );
}

export function ExportPanel({ profile }: { profile: ProjectCounterpartyProfile }) {
  const memo = profile.claimToIcMemo.firstPassIcMemo;
  const memoMarkdown = icMemoMarkdown(memo, profile.claimToIcMemo.publicEvidenceNotes ?? [], profile.claimToIcMemo.sourceCoverage ?? [], profile.claimToIcMemo.detectedClaims ?? [], profile.claimToIcMemo.deploymentLayerFindings ?? [], profile.claimToIcMemo.documentCoverage ?? [], profile.claimToIcMemo.relevantDocuments ?? [], profile.claimToIcMemo.evidenceLedger);
  const questions = memo.diligenceQuestions.map((question, index) => `${index + 1}. ${question}`).join("\n");

  return (
    <section className="space-y-5">
      <div className="border border-[#d9d3c8] bg-[#fbfaf7] p-6">
        <h2 className="text-2xl font-semibold">Copy outputs</h2>
        <p className="mt-3 text-base leading-7 text-[#151514]">
          These are formatted for pasting into an IC draft, partner prep note, email, or meeting doc. No downloads needed.
        </p>
      </div>
      <CopyBlock
        title="First-pass IC memo"
        description="Concise first-pass IC memo without the analysis appendix."
        value={memoMarkdown}
        buttonLabel="Copy IC memo"
        icon={<Clipboard className="h-5 w-5" />}
      />
      <CopyBlock
        title="Diligence questions"
        description="Question list only, for a counterparty call agenda or follow-up email."
        value={questions}
        buttonLabel="Copy questions"
        icon={<ListChecks className="h-5 w-5" />}
      />
    </section>
  );
}
