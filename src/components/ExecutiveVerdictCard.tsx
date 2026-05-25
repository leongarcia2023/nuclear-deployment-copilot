"use client";

import { useState } from "react";
import { Check, Clipboard } from "lucide-react";
import type { ProjectCounterpartyProfile } from "@/types/core";
import { copyToClipboard } from "@/lib/clipboard/copyToClipboard";
import { icMemoMarkdown } from "./ExportPanel";

export function ExecutiveVerdictCard({ profile }: { profile: ProjectCounterpartyProfile }) {
  const memo = profile.claimToIcMemo;
  const [copied, setCopied] = useState(false);
  const topKillRisks = memo.firstPassIcMemo.majorKillRisks.slice(0, 3);

  async function handleCopy() {
    const ok = await copyToClipboard(icMemoMarkdown(memo.firstPassIcMemo, memo.publicEvidenceNotes ?? [], memo.sourceCoverage ?? [], memo.detectedClaims ?? [], memo.deploymentLayerFindings ?? [], memo.documentCoverage ?? [], memo.relevantDocuments ?? [], memo.evidenceLedger));
    setCopied(ok);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <section className="border border-[#d9d3c8] bg-[#fbfaf7] p-6 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.34fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#7b5b25]">Verdict</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#151514] sm:text-4xl">{memo.verdict}</h2>
          <p className="mt-4 max-w-3xl text-xl leading-8 text-[#151514]">{memo.oneLineJudgment}</p>
        </div>
        <div className="border border-[#d9d3c8] bg-white p-5">
          <p className="text-sm font-semibold text-[#63615b]">Confidence</p>
          <p className="mt-2 text-2xl font-semibold text-[#151514]">{memo.confidence}</p>
          <p className="mt-3 text-base leading-7 text-[#151514]">First-pass diligence view, not an investment recommendation.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-7 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <h3 className="text-xl font-semibold">Recommended next step</h3>
          <p className="mt-3 text-lg leading-8 text-[#151514]">{memo.recommendedNextAction}</p>
          <button type="button" className="mt-5 inline-flex items-center justify-center gap-2 bg-[#151514] px-5 py-3 text-base font-semibold text-white" style={{ color: "#ffffff" }} onClick={handleCopy}>
            {copied ? <Check className="h-5 w-5" /> : <Clipboard className="h-5 w-5" />}
            {copied ? "Copied" : "Copy IC Memo"}
          </button>
        </div>
        <div>
          <h3 className="text-xl font-semibold">Top 3 kill risks</h3>
          <ol className="mt-3 space-y-2">
            {topKillRisks.map((risk, index) => (
              <li key={risk} className="grid grid-cols-[2rem_1fr] gap-3 text-base leading-7 text-[#151514]">
                <span className="font-semibold text-[#151514]">{index + 1}.</span>
                <span>{risk}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
