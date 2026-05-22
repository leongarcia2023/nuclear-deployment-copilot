"use client";

import { useState } from "react";
import type { ProjectCounterpartyProfile } from "@/types/core";

function MemoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-4 text-lg leading-8 text-[#3f3d38]">{children}</div>
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

function displayUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, "") + url.pathname;
  } catch {
    return value;
  }
}

function readableStatus(value: string) {
  return value.replaceAll("_", " ");
}

function AtomicClaims({ profile }: { profile: ProjectCounterpartyProfile }) {
  const claims = profile.claimToIcMemo.evidenceLedger?.atomicClaims ?? [];

  if (!claims.length) {
    return <p className="border border-[#d9d3c8] bg-white p-4 text-base leading-7 text-[#63615b]">No atomic claims were extracted from the current note.</p>;
  }

  return (
    <div className="space-y-3">
      {claims.slice(0, 8).map((claim) => (
        <article key={claim.id} className="border border-[#d9d3c8] bg-white p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="text-lg font-semibold leading-7">{claim.text}</h3>
            <span className="shrink-0 text-base font-semibold capitalize text-[#7b5b25]">{readableStatus(claim.evidenceStatus)}</span>
          </div>
          <p className="mt-2 text-base leading-7 text-[#63615b]">Layers: {claim.deploymentLayers.join(", ") || "Unclear"}</p>
        </article>
      ))}
    </div>
  );
}

function EvidenceLedgerView({ profile }: { profile: ProjectCounterpartyProfile }) {
  const claims = profile.claimToIcMemo.evidenceLedger?.atomicClaims ?? [];

  if (!claims.length) return null;

  return (
    <div className="space-y-3">
      {claims.slice(0, 8).map((claim) => (
        <article key={`ledger-${claim.id}`} className="border border-[#d9d3c8] bg-white p-4">
          <h3 className="text-lg font-semibold leading-7">{claim.text}</h3>
          <p className="mt-2 text-base leading-7 text-[#4a4842]"><span className="font-semibold">Evidence status:</span> {readableStatus(claim.evidenceStatus)} · Confidence: {claim.confidence}</p>
          <p className="mt-2 text-base leading-7 text-[#63615b]"><span className="font-semibold">Required evidence:</span> {claim.requiredEvidence}</p>
          <p className="mt-2 text-base leading-7 text-[#63615b]"><span className="font-semibold">Does not prove:</span> {claim.whatThisDoesNotProve}</p>
        </article>
      ))}
    </div>
  );
}

function EvidenceCoverageList({ profile }: { profile: ProjectCounterpartyProfile }) {
  const coverage = profile.claimToIcMemo.evidenceLedger?.deploymentLayerSummary ?? profile.claimToIcMemo.documentCoverage ?? [];

  if (!coverage.length) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {coverage.map((item) => (
        <article key={item.layer} className="border border-[#d9d3c8] bg-white p-4">
          <h3 className="text-lg font-semibold leading-7">{item.layer}</h3>
          <p className="mt-2 text-base leading-7 text-[#4a4842]"><span className="font-semibold">Corpus coverage:</span> {item.corpusCoverage}</p>
          <p className="mt-1 text-base leading-7 text-[#4a4842]"><span className="font-semibold">Target-specific support:</span> {item.targetSpecificSupport}</p>
          <p className="mt-2 text-base leading-7 text-[#63615b]">{item.conclusion}</p>
        </article>
      ))}
    </div>
  );
}

function PublicEvidenceNotes({ profile }: { profile: ProjectCounterpartyProfile }) {
  const notes = profile.claimToIcMemo.publicEvidenceNotes ?? [];

  if (!notes.length) {
    return (
      <p className="border border-[#d9d3c8] bg-white p-4 text-base leading-7 text-[#4a4842]">
        No public source in the current corpus supports this claim. Treat as unsupported unless the counterparty provides evidence.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {notes.slice(0, 6).map((note) => (
        <article key={note.id} className="border border-[#d9d3c8] bg-white p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="text-lg font-semibold leading-7">{note.title}</h3>
            <span className="text-base font-semibold text-[#7b5b25]">{note.sourceCategory}</span>
          </div>
          <p className="mt-2 text-base leading-7 text-[#4a4842]">{note.relevance}</p>
          {note.whatItEstablishes ? <p className="mt-2 text-base leading-7 text-[#4a4842]"><span className="font-semibold">Establishes:</span> {note.whatItEstablishes}</p> : null}
          {note.whatItDoesNotEstablish ? <p className="mt-2 text-base leading-7 text-[#63615b]"><span className="font-semibold">Does not establish:</span> {note.whatItDoesNotEstablish}</p> : null}
          <a className="mt-2 inline-block text-base font-semibold text-[#255d82] underline-offset-4 hover:underline" href={note.sourceUrl}>
            Open public source: {note.organization ?? note.agency} · {note.dateOrStatus ?? note.sourceName}
          </a>
          <p className="mt-1 break-all text-sm leading-6 text-[#63615b]">{displayUrl(note.sourceUrl)}</p>
        </article>
      ))}
    </div>
  );
}


function ChunkBackedEvidence({ profile }: { profile: ProjectCounterpartyProfile }) {
  const chunks = profile.claimToIcMemo.evidenceLedger?.atomicClaims.flatMap((claim) => claim.matchedChunks.map((chunk) => ({ ...chunk, claimText: claim.text }))) ?? [];
  const unique = chunks.filter((chunk, index, array) => array.findIndex((item) => item.chunkId === chunk.chunkId) === index).slice(0, 6);

  if (!unique.length) {
    return <p className="border border-[#d9d3c8] bg-white p-4 text-base leading-7 text-[#4a4842]">No chunk-backed excerpts matched the atomic claims. Treat the memo as unsupported until the counterparty provides evidence.</p>;
  }

  return (
    <div className="space-y-3">
      {unique.map((chunk) => (
        <article key={chunk.chunkId} className="border border-[#d9d3c8] bg-white p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="text-lg font-semibold leading-7">#{chunk.rank} {chunk.documentTitle}</h3>
            <span className="text-base font-semibold text-[#7b5b25]">{chunk.deploymentLayers.slice(0, 2).join(", ")}</span>
          </div>
          <p className="mt-3 text-base leading-7 text-[#3f3d38]">{chunk.excerpt}</p>
          <p className="mt-2 text-base leading-7 text-[#63615b]"><span className="font-semibold">Related atomic claim:</span> {chunk.claimText}</p>
          <p className="mt-2 text-base leading-7 text-[#63615b]"><span className="font-semibold">Deployment layer:</span> {chunk.deploymentLayers.slice(0, 2).join(", ")}</p>
          <p className="mt-2 text-base leading-7 text-[#63615b]"><span className="font-semibold">Why it matters:</span> {chunk.relevanceReason}</p>
          <p className="mt-2 text-base leading-7 text-[#63615b]"><span className="font-semibold">Does not prove:</span> {chunk.doesNotProve}</p>
        </article>
      ))}
    </div>
  );
}

function RelevantDocuments({ profile }: { profile: ProjectCounterpartyProfile }) {
  const documents = profile.claimToIcMemo.relevantDocuments ?? [];

  if (!documents.length) {
    return <p className="border border-[#d9d3c8] bg-white p-4 text-base leading-7 text-[#4a4842]">No ranked manifest documents matched the detected claim layers.</p>;
  }

  return (
    <div className="space-y-3">
      {documents.slice(0, 8).map((document) => (
        <article key={document.rank} className="border border-[#d9d3c8] bg-white p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="text-lg font-semibold leading-7">#{document.rank} {document.title}</h3>
            <span className="text-base font-semibold capitalize text-[#7b5b25]">{document.benchmarkValue}</span>
          </div>
          <p className="mt-2 text-base leading-7 text-[#4a4842]">{document.whyItMatters}</p>
          <p className="mt-2 text-base leading-7 text-[#63615b]"><span className="font-semibold">Layers:</span> {document.deploymentLayers.join(", ")}</p>
          <a className="mt-2 inline-block text-base font-semibold text-[#255d82] underline-offset-4 hover:underline" href={document.url}>Open document</a>
          <p className="mt-1 break-all text-sm leading-6 text-[#63615b]">{displayUrl(document.url)}</p>
        </article>
      ))}
    </div>
  );
}

function AnalysisDebug({ profile }: { profile: ProjectCounterpartyProfile }) {
  const [open, setOpen] = useState(false);
  const debug = profile.claimToIcMemo.analysisDebug;

  if (!debug) return null;

  return (
    <section className="border border-[#d9d3c8] bg-white p-4">
      <button className="text-base font-semibold text-[#255d82]" onClick={() => setOpen((value) => !value)}>
        {open ? "Hide analysis details" : "Show analysis details"}
      </button>
      {open ? (
        <div className="mt-4 grid gap-3 text-base leading-7 text-[#4a4842]">
          <p><span className="font-semibold text-[#151514]">Detected company profile:</span> {debug.detectedCompanyProfile ?? "No curated match"}</p>
          <p><span className="font-semibold text-[#151514]">Company category:</span> {debug.companyCategory}</p>
          <p><span className="font-semibold text-[#151514]">Detected claim types:</span> {debug.detectedClaimTypes.join(", ") || "None"}</p>
          <p><span className="font-semibold text-[#151514]">Deployment layers implicated:</span> {debug.deploymentLayersImplicated.join(", ") || "None"}</p>
          <p><span className="font-semibold text-[#151514]">Selected memo template:</span> {debug.selectedMemoTemplate}</p>
          <pre className="overflow-auto border border-[#d9d3c8] bg-[#fbfaf7] p-3 text-sm leading-6">{JSON.stringify(debug.triggeredKeywords, null, 2)}</pre>
        </div>
      ) : null}
    </section>
  );
}

export function DiligenceMemo({ profile }: { profile: ProjectCounterpartyProfile }) {
  const memo = profile.claimToIcMemo.firstPassIcMemo;
  const ledger = profile.claimToIcMemo.evidenceLedger;

  return (
    <article className="border border-[#d9d3c8] bg-[#fbfaf7] p-6 sm:p-8">
      <div className="space-y-10">
        <MemoSection title="Executive Summary">
          <p>{profile.claimToIcMemo.oneLineJudgment}</p>
          {profile.claimToIcMemo.confidenceRationale ? (
            <p className="mt-3 text-base leading-7 text-[#63615b]">{profile.claimToIcMemo.confidenceRationale}</p>
          ) : null}
        </MemoSection>

        <MemoSection title="Top missing evidence">
          <Bullets items={(ledger?.topMissingEvidence.length ? ledger.topMissingEvidence : memo.whatIsNotYetEvidenced).slice(0, 5)} />
        </MemoSection>

        <MemoSection title="Evidence coverage by deployment layer">
          <EvidenceCoverageList profile={profile} />
        </MemoSection>

        <MemoSection title="Chunk-backed evidence">
          <ChunkBackedEvidence profile={profile} />
        </MemoSection>

        <MemoSection title="What would change the verdict">
          <Bullets items={(ledger?.whatWouldChangeVerdict.length ? ledger.whatWouldChangeVerdict : memo.whatMustBeTrue).slice(0, 8)} />
        </MemoSection>

        <MemoSection title="Diligence questions">
          <ol className="space-y-3">
            {memo.diligenceQuestions.map((question, index) => (
              <li key={question} className="grid grid-cols-[2rem_1fr] gap-3">
                <span className="font-semibold text-[#151514]">{index + 1}.</span>
                <span>{question}</span>
              </li>
            ))}
          </ol>
        </MemoSection>

        <MemoSection title="Recommended next step">
          <p>{memo.recommendedNextStep}</p>
        </MemoSection>

        <AnalysisDebug profile={profile} />
      </div>
    </article>
  );
}
