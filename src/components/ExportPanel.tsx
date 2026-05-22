"use client";

import { useRef, useState } from "react";
import { Check, Clipboard, ListChecks } from "lucide-react";
import type { DeploymentLayerFinding, DetectedClaim, FirstPassIcMemo, MemoDocumentCoverageItem, MemoRelevantDocument, MemoSourceCoverage, ProjectCounterpartyProfile, PublicEvidenceNote } from "@/types/core";

function list(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

export function icMemoMarkdown(memo: FirstPassIcMemo, publicEvidenceNotes: PublicEvidenceNote[] = [], sourceCoverage: MemoSourceCoverage = [], detectedClaims: DetectedClaim[] = [], layerFindings: DeploymentLayerFinding[] = [], documentCoverage: MemoDocumentCoverageItem[] = [], relevantDocuments: MemoRelevantDocument[] = []) {
  const publicNotes = publicEvidenceNotes.length
    ? list(publicEvidenceNotes.map((note) => `${note.title} (${note.organization ?? note.agency}, ${note.sourceCategory}) - Establishes: ${note.whatItEstablishes ?? note.relevance} Does not establish: ${note.whatItDoesNotEstablish ?? "Target-specific bankability or private commitments."}`))
    : "- No public source in the current corpus supports this claim. Treat as unsupported unless the counterparty provides evidence.";
  const coverageNotes = sourceCoverage.length
    ? list(sourceCoverage.map((item) => `${item.layer}: ${item.status} - ${item.note}`))
    : "- No deployment-layer coverage generated.";
  const detectedClaimNotes = detectedClaims.length
    ? list(detectedClaims.map((claim) => `${claim.label} (${claim.triggeredKeywords.join(", ")})`))
    : "- No major claim types detected.";
  const layerFindingNotes = layerFindings.length
    ? list(layerFindings.map((item) => `${item.layer}: ${item.status} - ${item.finding} Required evidence: ${item.requiredEvidence}`))
    : coverageNotes;
  const missingNotes = layerFindings.filter((item) => item.status === "unsupported").length
    ? list(layerFindings.filter((item) => item.status === "unsupported").map((item) => `${item.layer}: ${item.requiredEvidence}`))
    : list(memo.whatIsNotYetEvidenced);
  const privateDiligenceNotes = layerFindings.filter((item) => item.status === "private diligence required" || item.status === "cannot know from public docs").length
    ? list(layerFindings.filter((item) => item.status === "private diligence required" || item.status === "cannot know from public docs").map((item) => `${item.layer}: ${item.requiredEvidence}`))
    : "- Commercial, EPC, financing, and confidential counterparty materials may require permissioned diligence.";
  const documentCoverageNotes = documentCoverage.length
    ? list(documentCoverage.map((item) => `${item.layer}: ${item.status} - ${item.matchedCount} matched manifest docs${item.topDocuments.length ? `; top docs: ${item.topDocuments.map((doc) => `#${doc.rank} ${doc.title}`).join(" | ")}` : ""}`))
    : "- No document coverage generated.";
  const relevantDocumentNotes = relevantDocuments.length
    ? list(relevantDocuments.map((document) => `#${document.rank} ${document.title} (${document.documentFamily}, ${document.benchmarkValue}) - ${document.whyItMatters}`))
    : "- No ranked manifest documents matched the detected claim layers.";

  return `# First-Pass IC Memo\n\nTarget: ${memo.target}\nUser type: ${memo.userType ?? "Not specified"}\nDecision question: ${memo.decision}\nVerdict: ${memo.verdict}\nConfidence: ${memo.confidence}\n\n## Executive summary\n${memo.thesis}\n\n## Situation\n${memo.situation}\n\n## Detected claims\n${detectedClaimNotes}\n\n## Evidence coverage by deployment layer\n${coverageNotes}\n\n## What is evidenced\n${list(memo.whatIsEvidenced)}\n\n## Document coverage\n${documentCoverageNotes}\n\n## Relevant documents\n${relevantDocumentNotes}\n\n## What is missing\n${missingNotes}\n\n## What requires private diligence\n${privateDiligenceNotes}\n\n## Deployment-layer findings\n${layerFindingNotes}\n\n## Major kill risks\n${list(memo.majorKillRisks)}\n\n## What must be true\n${list(memo.whatMustBeTrue)}\n\n## Diligence questions\n${list(memo.diligenceQuestions)}\n\n## Relevant public evidence notes\n${publicNotes}\n\n## Recommended next step\n${memo.recommendedNextStep}\n\n## Evidence notes\n${list(memo.sourcesAndEvidenceNotes)}\n`;
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
  const memoMarkdown = icMemoMarkdown(memo, profile.claimToIcMemo.publicEvidenceNotes ?? [], profile.claimToIcMemo.sourceCoverage ?? [], profile.claimToIcMemo.detectedClaims ?? [], profile.claimToIcMemo.deploymentLayerFindings ?? [], profile.claimToIcMemo.documentCoverage ?? [], profile.claimToIcMemo.relevantDocuments ?? []);
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
