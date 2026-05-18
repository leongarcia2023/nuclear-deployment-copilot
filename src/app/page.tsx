"use client";

import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { ArrowRight, BadgeCheck, Building2, CheckCircle2, CircleDollarSign, Factory, FileSearch, Landmark, Loader2, Upload, X } from "lucide-react";
import { Dashboard } from "@/components/Dashboard";
import type { ProjectCounterpartyProfile, UserMode } from "@/types/core";

const modes: Array<{
  id: UserMode;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  {
    id: "fuel-cycle supplier",
    title: "Fuel-cycle supplier",
    description: "Prioritize real HALEU demand, reservation risk, fuel specs, and delivery timing.",
    icon: Factory,
  },
  {
    id: "incumbent / strategic partner",
    title: "Incumbent / strategic partner",
    description: "Pressure-test deployability, partner fit, site readiness, and execution credibility.",
    icon: Landmark,
  },
  {
    id: "investor",
    title: "Investor",
    description: "Separate valuation narrative from milestone evidence, financing gates, and downside cases.",
    icon: CircleDollarSign,
  },
  {
    id: "developer",
    title: "Developer",
    description: "Find the proof gaps that block suppliers, partners, customers, and capital.",
    icon: Building2,
  },
];

const provenanceStates = [
  "public_source_verified",
  "uploaded_document_claimed",
  "internal_source_verified",
  "inferred",
  "missing",
  "unknowable_from_public_docs",
];

const modeEffects: Record<UserMode, string[]> = {
  "fuel-cycle supplier": ["Capacity reservation risk", "First-core HALEU timing", "Fuel specification proof"],
  "incumbent / strategic partner": ["Licensing posture", "Site and customer pull", "Execution dependency gaps"],
  investor: ["Financeability", "Milestone-backed claims", "Downside triggers"],
  developer: ["Missing proof package", "Counterparty questions", "Data room readiness"],
};

export default function Home() {
  const [selectedMode, setSelectedMode] = useState<UserMode>("fuel-cycle supplier");
  const [profile, setProfile] = useState<ProjectCounterpartyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const selected = useMemo(() => modes.find((mode) => mode.id === selectedMode) ?? modes[0], [selectedMode]);
  const SelectedIcon = selected.icon;

  async function runDemo() {
    setIsLoading(true);
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: selectedMode, fixture: "demo_project_profile.sample.json" }),
    });
    const data = (await response.json()) as { profile: ProjectCounterpartyProfile };
    setProfile(data.profile);
    setIsLoading(false);
    setTimeout(() => document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function openUploadPanel() {
    setUploadOpen(true);
    setTimeout(() => document.getElementById("upload-panel")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }

  return (
    <div className="min-h-screen bg-[#f4f1ea]">
      <section className="relative overflow-hidden border-b border-[#d9d3c8] bg-[#f4f1ea]">
        <div className="absolute inset-x-0 top-0 h-2 bg-[#151514]" />
        <div className="mx-auto grid max-w-7xl gap-8 px-5 pb-10 pt-10 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:pt-14">
          <div className="flex min-h-[640px] flex-col justify-between">
            <nav className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center bg-[#151514] text-white">
                  <FileSearch className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#151514]">Nuclear Deployment</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#63615b]">Intelligence Copilot</p>
                </div>
              </div>
              <button
                onClick={runDemo}
                className="inline-flex items-center gap-2 bg-[#151514] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#2c2a25]"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Run demo
              </button>
            </nav>

            <div className="py-12">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#7b5b25]">Source-grounded deployment diligence</p>
              <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.98] text-[#151514] sm:text-7xl">
                Who is actually deployable, and what evidence would prove it?
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#3f3d38]">
                Upload a reactor developer memo or project description and assess whether the company is a credible future HALEU or fuel-cycle customer.
              </p>

              <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
                <button className="flex items-center justify-center gap-2 border border-[#151514] bg-[#151514] px-5 py-4 text-sm font-bold text-white" onClick={runDemo}>
                  <FileSearch className="h-4 w-4" />
                  Run demo
                </button>
                <button
                  className="flex items-center justify-center gap-2 border border-[#bfb6a7] bg-[#fbfaf7] px-5 py-4 text-sm font-bold text-[#151514] transition hover:border-[#151514]"
                  onClick={openUploadPanel}
                  aria-expanded={uploadOpen}
                  aria-controls="upload-panel"
                >
                  <Upload className="h-4 w-4" />
                  Upload memo
                </button>
              </div>

              {uploadOpen ? (
                <div id="upload-panel" className="mt-5 max-w-2xl border border-[#d9d3c8] bg-[#fbfaf7] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b5b25]">Upload intake</p>
                      <h2 className="mt-2 text-xl font-semibold">Memo upload is staged for v0</h2>
                      <p className="mt-2 text-sm leading-6 text-[#63615b]">
                        Pick a memo to show the intake state. This demo still analyzes the sample profile so the evidence model stays deterministic.
                      </p>
                    </div>
                    <button className="p-2 text-[#63615b] transition hover:text-[#151514]" onClick={() => setUploadOpen(false)} aria-label="Close upload panel">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <label className="mt-5 flex cursor-pointer flex-col items-center justify-center border border-dashed border-[#bfb6a7] bg-[#f4f1ea] px-5 py-7 text-center transition hover:border-[#151514]">
                    <Upload className="h-6 w-6 text-[#255d82]" />
                    <span className="mt-3 text-sm font-bold">{selectedFileName ?? "Choose reactor memo or project description"}</span>
                    <span className="mt-1 text-xs text-[#63615b]">PDF, DOCX, TXT, or JSON. Parsing comes after this polished demo shell.</span>
                    <input
                      className="sr-only"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.json"
                      onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? null)}
                    />
                  </label>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button className="inline-flex items-center justify-center gap-2 border border-[#151514] bg-[#151514] px-4 py-3 text-sm font-bold text-white" onClick={runDemo}>
                      {selectedFileName ? <CheckCircle2 className="h-4 w-4" /> : <FileSearch className="h-4 w-4" />}
                      Analyze sample instead
                    </button>
                    <p className="text-sm leading-6 text-[#63615b]">
                      The next build can replace this fixture call with document extraction and source-grounded analysis.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="border border-[#d9d3c8] bg-[#fbfaf7] p-4">
                <p className="text-3xl font-semibold">0</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#63615b]">Live LLM calls in v0</p>
              </div>
              <div className="border border-[#d9d3c8] bg-[#fbfaf7] p-4">
                <p className="text-3xl font-semibold">6</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#63615b]">Provenance states</p>
              </div>
              <div className="border border-[#d9d3c8] bg-[#fbfaf7] p-4">
                <p className="text-3xl font-semibold">1</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#63615b]">Demo project loaded</p>
              </div>
            </div>
          </div>

          <aside className="border border-[#d9d3c8] bg-[#fbfaf7] p-5 lg:mt-14">
            <div className="flex items-start justify-between gap-4 border-b border-[#d9d3c8] pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b5b25]">User mode</p>
                <h2 className="mt-2 text-2xl font-semibold">{selected.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#63615b]">{selected.description}</p>
              </div>
              <SelectedIcon className="h-7 w-7 text-[#256c55]" />
            </div>

            <div className="mt-5 grid gap-3">
              {modes.map((mode) => {
                const Icon = mode.icon;
                const active = selectedMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`flex min-h-24 items-start gap-4 border p-4 text-left transition ${
                      active ? "border-[#151514] bg-[#eee7d9]" : "border-[#d9d3c8] bg-[#fbfaf7] hover:border-[#8c8375]"
                    }`}
                  >
                    <Icon className="mt-1 h-5 w-5 shrink-0 text-[#255d82]" />
                    <span>
                      <span className="block font-semibold">{mode.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-[#63615b]">{mode.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 border border-[#d9d3c8] bg-[#f4f1ea] p-4">
              <p className="text-sm font-bold">This mode changes the dashboard lens</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {modeEffects[selectedMode].map((effect) => (
                  <span key={effect} className="rounded-full border border-[#bfb6a7] bg-[#fbfaf7] px-2.5 py-1 text-xs font-bold text-[#3f3d38]">
                    {effect}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 border border-[#d9d3c8] bg-[#f4f1ea] p-4">
              <div className="mb-3 flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-[#256c55]" />
                <p className="text-sm font-bold">Evidence labels are first-class</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {provenanceStates.map((state) => (
                  <span key={state} className={`evidence-${state} rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]`}>
                    {state.replaceAll("_", " ")}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {profile ? (
        <Dashboard profile={profile} mode={selectedMode} />
      ) : (
        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <div className="border border-[#d9d3c8] bg-[#fbfaf7] p-6 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#7b5b25]">Demo ready</p>
            <p className="mt-2 text-lg text-[#3f3d38]">Run the sample analysis to load the project-readiness dashboard.</p>
          </div>
        </section>
      )}
    </div>
  );
}
