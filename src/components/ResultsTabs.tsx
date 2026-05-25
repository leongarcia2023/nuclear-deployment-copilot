"use client";

import { useEffect, useState } from "react";
import riskTaxonomy from "../../data/risk_taxonomy.sample.json";
import type { ProjectCounterpartyProfile } from "@/types/core";
import type { CorpusChunk, RiskTaxonomy } from "@/types/corpus";
import { CannotKnowPanel } from "./CannotKnowPanel";
import { CounterpartyQuestions } from "./CounterpartyQuestions";
import { DiligenceMemo } from "./DiligenceMemo";
import { EvidenceTable } from "./EvidenceTable";
import { ExportPanel } from "./ExportPanel";
import { UnknownsRegister } from "./UnknownsRegister";

type TabId = "memo" | "evidence" | "unknowns" | "questions" | "cannot-know" | "export";
type ViewMode = "executive" | "analyst";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "memo", label: "Memo" },
  { id: "evidence", label: "Evidence" },
  { id: "unknowns", label: "Unknowns" },
  { id: "questions", label: "Questions" },
  { id: "cannot-know", label: "Cannot Know" },
  { id: "export", label: "Export" },
];

function AnalystDetails({ chunks }: { chunks: CorpusChunk[] }) {
  const taxonomy = riskTaxonomy as RiskTaxonomy;

  return (
    <section className="mt-8 border border-[#d9d3c8] bg-[#fbfaf7] p-6">
      <h2 className="text-2xl font-semibold">Analyst details</h2>
      <p className="mt-3 text-base leading-7 text-[#151514]">
        Dense debug context for analysts. Executive users can ignore this section.
      </p>

      <div className="mt-6 grid gap-6">
        <div>
          <h3 className="text-xl font-semibold">Retrieved sample chunks</h3>
          <div className="mt-3 space-y-3">
            {chunks.map((chunk) => (
              <article key={chunk.id} className="border border-[#d9d3c8] bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <h4 className="text-lg font-semibold">{chunk.title}</h4>
                  <span className="text-base font-semibold text-[#151514]">{chunk.agency}</span>
                </div>
                <p className="mt-2 text-base leading-7 text-[#151514]">{chunk.text}</p>
                <p className="mt-2 text-sm text-[#63615b]">{[...chunk.topic_tags, ...chunk.relevance_modules.map((item) => item.replaceAll("_", " "))].join(", ")}</p>
                <p className="mt-2 text-sm text-[#63615b]">Why it matters: {chunk.why_it_matters}</p>
              </article>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold">Risk taxonomy</h3>
          <div className="mt-3 space-y-3">
            {taxonomy.items.map((item) => (
              <article key={item.id} className="border border-[#d9d3c8] bg-white p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#7b5b25]">{item.category}</p>
                <h4 className="mt-1 text-lg font-semibold">{item.label}</h4>
                <p className="mt-2 text-base leading-7 text-[#151514]">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ResultsTabs({ profile }: { profile: ProjectCounterpartyProfile }) {
  const [activeTab, setActiveTab] = useState<TabId>("memo");
  const [viewMode, setViewMode] = useState<ViewMode>("executive");
  const [chunks, setChunks] = useState<CorpusChunk[]>([]);

  useEffect(() => {
    if (viewMode !== "analyst") return;
    fetch("/api/corpus?q=haleu")
      .then((response) => response.json())
      .then((data: { chunks: CorpusChunk[] }) => setChunks(data.chunks))
      .catch(() => setChunks([]));
  }, [viewMode]);

  return (
    <section className="mt-8">
      <div className="flex flex-col gap-4 border-b border-[#d9d3c8] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">IC memo file</h2>
          <p className="mt-2 text-base leading-7 text-[#63615b]">Start with the IC memo. Open the tabs when you need evidence, unknowns, exports, or analyst detail.</p>
        </div>
        <div className="inline-flex border border-[#bfb6a7] bg-[#fbfaf7] p-1">
          {(["executive", "analyst"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 text-base font-semibold capitalize ${viewMode === mode ? "bg-[#151514] text-white" : "text-[#151514]"}`}
            >
              {mode} view
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`border px-4 py-3 text-base font-semibold ${activeTab === tab.id ? "border-[#151514] bg-[#151514] text-white" : "border-[#d9d3c8] bg-[#fbfaf7] text-[#151514]"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "memo" ? <DiligenceMemo profile={profile} /> : null}
        {activeTab === "evidence" ? <EvidenceTable rows={profile.evidenceQuality} sources={profile.sources} /> : null}
        {activeTab === "unknowns" ? <UnknownsRegister unknowns={profile.unknowns} /> : null}
        {activeTab === "questions" ? <CounterpartyQuestions questions={profile.counterpartyQuestions} /> : null}
        {activeTab === "cannot-know" ? <CannotKnowPanel items={profile.cannotKnowFromPublicDocs} /> : null}
        {activeTab === "export" ? <ExportPanel profile={profile} /> : null}
      </div>

      {viewMode === "analyst" ? <AnalystDetails chunks={chunks} /> : null}
    </section>
  );
}
