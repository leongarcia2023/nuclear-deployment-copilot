"use client";

import { useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { SiteNav } from "@/components/SiteNav";
import { IntakeForm } from "@/components/IntakeForm";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { analysisModeCopy } from "@/lib/analysis/analysisModes";
import type { AppAnalysisMode, InputMode, ProjectCounterpartyProfile, UserMode } from "@/types/core";

type DemoId = "helios-compute-campus" | "haleu-readiness" | "nrc-preapp-2030" | "doe-award-financing" | "mou-offtake";

const demos: Array<{
  id: DemoId;
  label: string;
  counterparty: string;
  decisionQuestion: string;
  userType: string;
  claim: string;
}> = [
  {
    id: "helios-compute-campus",
    label: "Helios Compute Campus",
    counterparty: "Helios Compute Campus",
    decisionQuestion: "Is this worth deeper diligence?",
    userType: "Investor",
    claim:
      "Helios claims it can deploy a 300 MW behind-the-meter AI data center campus by 2031 using bridge power in Phase 1 and advanced nuclear baseload in Phase 3, supported by a hyperscaler MOU and ongoing NRC engagement.",
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
  const [activeDemoId, setActiveDemoId] = useState<DemoId>("helios-compute-campus");

  async function analyzeClaim(input: {
    demoId: DemoId;
    analysisMode: AppAnalysisMode;
    counterparty: string;
    decisionQuestion: string;
    userType: string;
    sanitizedNotes: string;
  }) {
    setIsLoading(true);
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: selectedMode,
        inputMode,
        analysisMode: input.analysisMode,
        demoId: input.demoId,
        publicQuery: input.counterparty,
        decisionQuestion: input.decisionQuestion,
        userType: input.userType,
        sanitizedNotes: input.sanitizedNotes,
        fixture: "demo_project_profile.sample.json",
      }),
    });
    const data = (await response.json()) as { profile: ProjectCounterpartyProfile };
    setProfile(data.profile);
    setIsLoading(false);
    setTimeout(() => document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  async function runDemo() {
    await analyzeClaim({ demoId: activeDemoId, analysisMode, counterparty, decisionQuestion, userType, sanitizedNotes });
  }

  async function runFlagshipDemo() {
    const demo = demos[0];
    setAnalysisMode("demo");
    setActiveDemoId(demo.id);
    setCounterparty(demo.counterparty);
    setDecisionQuestion(demo.decisionQuestion);
    setUserType(demo.userType);
    setSanitizedNotes(demo.claim);
    await analyzeClaim({
      demoId: demo.id,
      analysisMode: "demo",
      counterparty: demo.counterparty,
      decisionQuestion: demo.decisionQuestion,
      userType: demo.userType,
      sanitizedNotes: demo.claim,
    });
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
            <p className="mt-4 max-w-3xl text-xl leading-8 text-[#3f3d38]">Overclaim detection for advanced nuclear and AI infrastructure deployment claims.</p>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#4a4842]">
              Paste a hypey deployment claim. The system decomposes it into evidence requirements, separates public context from target-specific proof, and generates a first-pass diligence memo.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button className="bg-[#151514] px-5 py-3 text-base font-semibold text-white disabled:opacity-60" onClick={runFlagshipDemo} disabled={isLoading}>
                {isLoading ? "Generating memo..." : "Run 60-second flagship demo"}
              </button>
              <a className="border border-[#151514] px-5 py-3 text-base font-semibold text-[#151514]" href="#diligence-intake">
                Start diligence memo
              </a>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {["150-source manifest", "2,521 evidence chunks", "76 adversarial evals", "10 golden memo tests", "No paid AI API calls"].map((badge) => (
                <span key={badge} className="border border-[#bfb6a7] bg-[#fbfaf7] px-3 py-2 text-sm font-semibold text-[#151514]">{badge}</span>
              ))}
            </div>
          </header>

          <div className="space-y-5">
            <PrivacyNotice />
            <section className="grid gap-4 md:grid-cols-2">
              <article className="border border-[#d9d3c8] bg-[#fbfaf7] p-5">
                <p className="text-base font-semibold text-[#151514]">Why not just ChatGPT?</p>
                <p className="mt-3 text-base leading-7 text-[#4a4842]">
                  Generic ChatGPT can write a fluent memo. This system forces each claim through a nuclear deployment evidence framework, separates public context from target-specific proof, retrieves source-grounded context, and regression-tests against common diligence mistakes like treating an MOU as binding offtake or pre-application as approval.
                </p>
              </article>
              <article className="border border-[#d9d3c8] bg-[#fbfaf7] p-5">
                <p className="text-base font-semibold text-[#151514]">Built with</p>
                <ul className="mt-3 space-y-2 text-base leading-7 text-[#4a4842]">
                  <li>150-source ranked manifest</li>
                  <li>2,521 chunked evidence passages</li>
                  <li>76 adversarial eval cases</li>
                  <li>10 golden memo regression tests</li>
                  <li>Deterministic analysis, no paid AI API calls</li>
                </ul>
              </article>
            </section>
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
                Demo mode uses deterministic templates to illustrate the workflow. Source-grounded analysis retrieves from NRC, DOE, financing, fuel-cycle, interconnection, and public company sources while keeping synthesis deterministic.
              </p>
            </section>
            <section className="border border-[#d9d3c8] bg-[#fbfaf7] p-5">
              <p className="text-base font-semibold text-[#151514]">Demo presets</p>
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
