"use client";

import { useRef, useState } from "react";
import { Check, Clipboard, ListChecks } from "lucide-react";
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
  const atomicClaimNotes = evidenceLedger?.atomicClaims.length
    ? list(evidenceLedger.atomicClaims.map((claim) => `${claim.text} — ${claim.evidenceStatus.replaceAll("_", " ")}`))
    : detectedClaims.length
      ? list(detectedClaims.map((claim) => `${claim.label} (${claim.triggeredKeywords.join(", ")})`))
      : "- No atomic claims detected.";
  const ledgerNotes = evidenceLedger?.atomicClaims.length
    ? list(evidenceLedger.atomicClaims.map((claim) => `${claim.text}: ${claim.evidenceStatus.replaceAll("_", " ")}; required evidence: ${claim.requiredEvidence}; does not prove: ${claim.whatThisDoesNotProve}`))
    : "- No evidence ledger generated.";
  const documentCoverageNotes = (evidenceLedger?.deploymentLayerSummary ?? documentCoverage).length
    ? list((evidenceLedger?.deploymentLayerSummary ?? documentCoverage).map((item) => `${item.layer}: Corpus coverage: ${item.corpusCoverage}; Target-specific support: ${item.targetSpecificSupport}. ${item.conclusion}`))
    : "- No document coverage generated.";
  const missingNotes = evidenceLedger?.topMissingEvidence.length
    ? list(evidenceLedger.topMissingEvidence)
    : layerFindings.filter((item) => item.status === "unsupported").length
      ? list(layerFindings.filter((item) => item.status === "unsupported").map((item) => `${item.layer}: ${item.requiredEvidence}`))
      : list(memo.whatIsNotYetEvidenced);
  const verdictChangeNotes = evidenceLedger?.whatWouldChangeVerdict.length
    ? list(evidenceLedger.whatWouldChangeVerdict)
    : list(memo.whatMustBeTrue);
  const chunkNotes = evidenceLedger?.atomicClaims.flatMap((claim) => claim.matchedChunks.map((chunk) => `#${chunk.rank} ${chunk.documentTitle}: ${chunk.excerpt} Relevance: ${chunk.relevanceReason} Does not prove: ${chunk.doesNotProve}`)) ?? [];
  const relevantChunkNotes = chunkNotes.length
    ? list(Array.from(new Set(chunkNotes)).slice(0, 6))
    : "- No chunk-backed evidence matched the atomic claims.";

  return `# First-Pass IC Memo

Target: ${memo.target}
User type: ${memo.userType ?? "Not specified"}
Decision question: ${memo.decision}
Verdict: ${memo.verdict}
Confidence: ${memo.confidence}

## Executive summary
${memo.thesis}

## Atomic claims
${atomicClaimNotes}

## Evidence ledger
${ledgerNotes}

## Evidence coverage by deployment layer
${documentCoverageNotes}

## Top missing evidence
${missingNotes}

## What would change the verdict
${verdictChangeNotes}

## Diligence questions
${list(memo.diligenceQuestions)}

## Relevant chunk-backed evidence
${relevantChunkNotes}

## Recommended next step
${memo.recommendedNextStep}
`;
}
async function copyText(text: string, fallbackElement: HTMLTextAreaElement | null) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to selection-based copy.
  }

  if (!fallbackElement) return false;
  fallbackElement.focus();
  fallbackElement.select();
  return document.execCommand("copy");
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
    const copied = await copyText(value, textareaRef.current);
    setStatus(copied ? "copied" : "manual");
    window.setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <section className="border border-[#d9d3c8] bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="mt-2 text-base leading-7 text-[#4a4842]">{description}</p>
        </div>
        <button className="inline-flex shrink-0 items-center justify-center gap-2 bg-[#151514] px-5 py-3 text-base font-semibold text-white" onClick={handleCopy}>
          {status === "copied" ? <Check className="h-5 w-5" /> : icon}
          {status === "copied" ? "Copied" : buttonLabel}
        </button>
      </div>
      {status === "manual" ? <p className="mt-3 text-base font-semibold text-[#9a3e33]">Copy was blocked by the browser. The text is selected below so you can press Cmd+C.</p> : null}
      <textarea
        ref={textareaRef}
        className="mt-4 h-80 w-full resize-y border border-[#d9d3c8] bg-[#fbfaf7] p-4 font-mono text-sm leading-6 text-[#292824] outline-none focus:border-[#151514]"
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
        <p className="mt-3 text-base leading-7 text-[#4a4842]">
          These are formatted for pasting into an IC draft, partner prep note, email, or meeting doc. No downloads needed.
        </p>
      </div>
      <CopyBlock
        title="First-pass IC memo"
        description="Full memo with situation, thesis, evidence, kill risks, what must be true, questions, next step, and public evidence notes."
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
