"use client";

import Link from "next/link";
import { useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { IntakeForm } from "@/components/IntakeForm";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { analysisModeCopy } from "@/lib/analysis/analysisModes";
import type { AppAnalysisMode, InputMode, ProjectCounterpartyProfile, UserMode } from "@/types/core";

type DemoId = "smr-data-center" | "haleu-customer" | "deployment-timeline";

const demos: Array<{
  id: DemoId;
  label: string;
  counterparty: string;
  decisionQuestion: string;
  userType: string;
  claim: string;
}> = [
  {
    id: "smr-data-center",
    label: "Load demo: data center power claim",
    counterparty: "SMR + data center power campus",
    decisionQuestion: "Is this worth deeper diligence?",
    userType: "Investor",
    claim:
      "A developer claims it can deliver a 300 MW behind-the-meter nuclear-powered data center campus by 2031 using advanced reactors, HALEU fuel, and long-term data center offtake. The company says it has begun regulatory engagement and expects to sign strategic fuel-cycle and EPC partnerships soon.",
  },
  {
    id: "haleu-customer",
    label: "Load demo: HALEU customer claim",
    counterparty: "Prospective HALEU fuel-cycle customer",
    decisionQuestion: "Is this a credible fuel-cycle customer?",
    userType: "Fuel-cycle supplier",
    claim:
      "A reactor developer claims it will need material HALEU supply for first core and reloads before 2031 and wants to reserve strategic fuel-cycle capacity before final licensing and project finance milestones are complete.",
  },
  {
    id: "deployment-timeline",
    label: "Load demo: reactor deployment timeline claim",
    counterparty: "Advanced reactor deployment timeline",
    decisionQuestion: "Is this deployment timeline believable?",
    userType: "Strategic partner / incumbent",
    claim:
      "A developer claims its advanced reactor can move from current public regulatory engagement to commercial deployment by 2030-2031, with site work, customer contracting, EPC scope, fuel supply, and financing all advancing in parallel.",
  },
];

export default function Home() {
  const [selectedMode] = useState<UserMode>("investor");
  const [inputMode] = useState<InputMode>("sanitized note / non-confidential memo");
  const [analysisMode, setAnalysisMode] = useState<AppAnalysisMode>("demo");
  const [profile, setProfile] = useState<ProjectCounterpartyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [counterparty, setCounterparty] = useState("");
  const [decisionQuestion, setDecisionQuestion] = useState("Is this worth deeper diligence?");
  const [userType, setUserType] = useState("Fuel-cycle supplier");
  const [sanitizedNotes, setSanitizedNotes] = useState("");
  const [activeDemoId, setActiveDemoId] = useState<DemoId>("smr-data-center");

  async function runDemo() {
    setIsLoading(true);
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: selectedMode,
        inputMode,
        analysisMode,
        demoId: activeDemoId,
        publicQuery: counterparty,
        decisionQuestion,
        userType,
        sanitizedNotes,
        fixture: "demo_project_profile.sample.json",
      }),
    });
    const data = (await response.json()) as { profile: ProjectCounterpartyProfile };
    setProfile(data.profile);
    setIsLoading(false);
    setTimeout(() => document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function loadDemo(demoId: DemoId) {
    const demo = demos.find((item) => item.id === demoId) ?? demos[0];
    setAnalysisMode("demo");
    setActiveDemoId(demo.id);
    setCounterparty(demo.counterparty);
    setDecisionQuestion(demo.decisionQuestion);
    setUserType(demo.userType);
    setSanitizedNotes(demo.claim);
  }

  return (
    <div className="min-h-screen bg-[#f4f1ea]">
      <nav className="border-b border-[#d9d3c8] bg-[#f4f1ea] px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link className="text-base font-semibold text-[#151514]" href="/">Deal Diligence</Link>
          <div className="flex items-center gap-5 text-base text-[#63615b]">
            <Link className="hover:text-[#151514]" href="/corpus">Source Library</Link>
            <Link className="hover:text-[#151514]" href="/methodology">Methodology</Link>
          </div>
        </div>
      </nav>

      <section className="px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <header className="mb-8">
            <h1 className="text-4xl font-semibold leading-tight text-[#151514] sm:text-6xl">Nuclear Deal Diligence Copilot</h1>
            <p className="mt-4 max-w-3xl text-xl leading-8 text-[#3f3d38]">Turn nuclear deployment claims into evidence-backed diligence memos.</p>
          </header>

          <div className="space-y-5">
            <PrivacyNotice />
            <section className="border border-[#d9d3c8] bg-[#fbfaf7] p-5">
              <p className="text-base font-semibold text-[#7b5b25]">Analysis mode</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  className={`border px-4 py-4 text-left text-base ${analysisMode === "demo" ? "border-[#151514] bg-white" : "border-[#d9d3c8] bg-[#f4f1ea]"}`}
                  onClick={() => setAnalysisMode("demo")}
                >
                  <span className="block font-semibold text-[#151514]">{analysisModeCopy.demo.label}</span>
                  <span className="mt-1 block leading-7 text-[#63615b]">{analysisModeCopy.demo.description}</span>
                </button>
                <button
                  className={`border px-4 py-4 text-left text-base ${analysisMode === "source_grounded_scaffold" ? "border-[#151514] bg-white" : "border-[#d9d3c8] bg-[#f4f1ea]"}`}
                  onClick={() => setAnalysisMode("source_grounded_scaffold")}
                >
                  <span className="block font-semibold text-[#151514]">{analysisModeCopy.source_grounded_scaffold.label}</span>
                  <span className="mt-1 block leading-7 text-[#63615b]">{analysisModeCopy.source_grounded_scaffold.description}</span>
                </button>
              </div>
              <p className="mt-4 text-base leading-7 text-[#4a4842]">
                Demo mode uses deterministic templates to illustrate the workflow. Source-grounded analysis mode will retrieve from NRC, DOE, financing, fuel-cycle, interconnection, and public company sources to generate cited memos.
              </p>
            </section>
            <IntakeForm
              counterparty={counterparty}
              setCounterparty={setCounterparty}
              decisionQuestion={decisionQuestion}
              setDecisionQuestion={setDecisionQuestion}
              userType={userType}
              setUserType={setUserType}
              sanitizedNotes={sanitizedNotes}
              setSanitizedNotes={setSanitizedNotes}
              isLoading={isLoading}
              onGenerate={runDemo}
            />
            <div className="flex flex-wrap gap-3">
              {demos.map((demo) => (
                <button key={demo.id} className="border border-[#bfb6a7] bg-[#fbfaf7] px-4 py-3 text-base font-semibold text-[#255d82]" onClick={() => loadDemo(demo.id)}>
                  {demo.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {profile ? <Dashboard profile={profile} /> : null}
    </div>
  );
}
