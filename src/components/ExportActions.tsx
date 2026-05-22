"use client";

import { Clipboard, Download, FileJson, ListChecks } from "lucide-react";
import type { ProjectCounterpartyProfile } from "@/types/core";

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function memoMarkdown(profile: ProjectCounterpartyProfile) {
  const questions = profile.counterpartyQuestions.map((q) => `- ${q.question}\n  - Why it matters: ${q.whyItMatters}\n  - Expected evidence: ${q.expectedEvidence}`).join("\n");
  const memo = profile.memo.map((section) => `## ${section.heading}\n\n${section.body}`).join("\n\n");

  return `# ${profile.companyName}: ${profile.projectName}\n\n${profile.oneLineAssessment.value}\n\n${memo}\n\n## Questions for Next Counterparty Call\n\n${questions}\n`;
}

export function ExportActions({ profile }: { profile: ProjectCounterpartyProfile }) {
  const executiveSummary = `${profile.companyName} / ${profile.projectName}: ${profile.oneLineAssessment.value}`;
  const questions = profile.counterpartyQuestions.map((q) => `- ${q.question}\n  Required evidence: ${q.expectedEvidence}`).join("\n");

  return (
    <section className="my-6 border border-[#d9d3c8] bg-[#fbfaf7] p-5">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b5b25]">Exports</p>
        <h2 className="mt-2 text-2xl font-semibold">Diligence outputs</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          className="inline-flex items-center justify-center gap-2 border border-[#151514] bg-[#151514] px-4 py-3 text-sm font-bold text-white"
          onClick={() => downloadText(`${profile.id}.json`, JSON.stringify(profile, null, 2), "application/json")}
        >
          <FileJson className="h-4 w-4" />
          Export profile JSON
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 border border-[#bfb6a7] bg-[#f4f1ea] px-4 py-3 text-sm font-bold text-[#151514]"
          onClick={() => downloadText(`${profile.id}.md`, memoMarkdown(profile), "text/markdown")}
        >
          <Download className="h-4 w-4" />
          Export memo Markdown
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 border border-[#bfb6a7] bg-[#f4f1ea] px-4 py-3 text-sm font-bold text-[#151514]"
          onClick={() => navigator.clipboard.writeText(executiveSummary)}
        >
          <Clipboard className="h-4 w-4" />
          Copy executive summary
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 border border-[#bfb6a7] bg-[#f4f1ea] px-4 py-3 text-sm font-bold text-[#151514]"
          onClick={() => navigator.clipboard.writeText(questions)}
        >
          <ListChecks className="h-4 w-4" />
          Copy counterparty questions
        </button>
      </div>
    </section>
  );
}
