"use client";

import { useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { SiteNav } from "@/components/SiteNav";
import { IntakeForm } from "@/components/IntakeForm";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { analysisModeCopy } from "@/lib/analysis/analysisModes";
import type { AppAnalysisMode, InputMode, ProjectCounterpartyProfile, UserMode } from "@/types/core";

type DemoId = "data-center-campus" | "haleu-readiness" | "nrc-preapp-2030" | "doe-award-financing" | "mou-offtake";

const demos: Array<{
  id: DemoId;
  label: string;
  counterparty: string;
  decisionQuestion: string;
  userType: string;
  claim: string;
}> = [
  {
    id: "data-center-campus",
    label: "Data center power campus",
    counterparty: "AI Power Campus Developer",
    decisionQuestion: "Is this worth deeper diligence?",
    userType: "Investor",
    claim:
      "Company claims it can develop a 300 MW behind-the-meter AI data center campus with near-term bridge power and future nuclear baseload integration by 2031.",
  },
  {
    id: "haleu-readiness",
    label: "HALEU fuel-readiness claim",
    counterparty: "Oklo",
    decisionQuestion: "Is this a credible fuel-cycle customer?",
    userType: "Fuel-cycle supplier",
    claim:
      "A reactor developer claims it has secured HALEU supply for first core and reloads and can begin deployment by 2031.",
  },
  {
    id: "nrc-preapp-2030",
    label: "NRC pre-application to 2030",
    counterparty: "Reactor Developer",
    decisionQuestion: "Is this deployment timeline believable?",
    userType: "Investor",
    claim:
      "A reactor developer says it is in NRC pre-application and expects commercial operation by 2030.",
  },
  {
    id: "doe-award-financing",
    label: "DOE award vs financing",
    counterparty: "Funding Selected Developer",
    decisionQuestion: "Is this worth deeper diligence?",
    userType: "Investor",
    claim:
      "A developer says DOE selected it for funding, so project finance is solved and construction can begin.",
  },
  {
    id: "mou-offtake",
    label: "MOU vs binding offtake",
    counterparty: "Hyperscaler AI Campus",
    decisionQuestion: "Is this partner/customer credible?",
    userType: "Data center power buyer",
    claim:
      "A company says it has a hyperscaler MOU and therefore its nuclear-powered data center project is commercially de-risked.",
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
  const [activeDemoId, setActiveDemoId] = useState<DemoId>("data-center-campus");

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
      <SiteNav />

      <section className="px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <header className="mb-8">
            <h1 className="text-4xl font-semibold leading-tight text-[#151514] sm:text-6xl">Nuclear Deployment Intelligence</h1>
            <p className="mt-4 max-w-3xl text-xl leading-8 text-[#3f3d38]">Source-grounded diligence for advanced nuclear deployment claims.</p>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#4a4842]">
              Paste a company claim or sanitized note. The system decomposes it into deployment claims, checks them against a curated nuclear deployment corpus, separates public context from target-specific support, and produces a concise diligence memo.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a className="bg-[#151514] px-5 py-3 text-base font-semibold text-white" href="#diligence-intake">
                Start diligence memo
              </a>
              <p className="text-base leading-7 text-[#4a4842]">No paid AI API calls in this version. Analysis is deterministic and source-grounded.</p>
            </div>
          </header>

          <div className="space-y-5">
            <PrivacyNotice />
            <section className="border border-[#d9d3c8] bg-[#fbfaf7] p-5">
              <p className="text-base font-semibold text-[#151514]">How to use this</p>
              <ol className="mt-3 grid gap-3 text-base leading-7 text-[#4a4842] sm:grid-cols-2">
                <li><span className="font-semibold text-[#151514]">Step 1:</span> Paste a public claim or sanitized note.</li>
                <li><span className="font-semibold text-[#151514]">Step 2:</span> Pick user type and decision question.</li>
                <li><span className="font-semibold text-[#151514]">Step 3:</span> Generate a first-pass memo.</li>
                <li><span className="font-semibold text-[#151514]">Step 4:</span> Review missing evidence, public context, and diligence questions.</li>
              </ol>
            </section>
            <section className="border border-[#d9d3c8] bg-[#fbfaf7] p-5">
              <p className="text-base leading-7 text-[#4a4842]">
                This tool does not verify private contracts, financing terms, site rights, or confidential counterparties. It identifies what public evidence supports, what is missing, and what requires private diligence.
              </p>
            </section>
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
            <section className="border border-[#d9d3c8] bg-[#fbfaf7] p-5">
              <p className="text-base font-semibold text-[#151514]">Demo Mode presets</p>
              <p className="mt-1 text-base leading-7 text-[#4a4842]">Load a deterministic evidence-ledger scenario, then generate the memo.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {demos.map((demo) => (
                  <button key={demo.id} className="border border-[#bfb6a7] bg-[#fbfaf7] px-4 py-3 text-base font-semibold text-[#255d82]" onClick={() => loadDemo(demo.id)}>
                    {demo.label}
                  </button>
                ))}
              </div>
            </section>
            <div id="diligence-intake">
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
            </div>
          </div>
        </div>
      </section>

      {profile ? <Dashboard profile={profile} /> : null}
    </div>
  );
}
