"use client";

import { ArrowRight, Loader2 } from "lucide-react";

const decisionQuestions = [
  "Is this a credible fuel-cycle customer?",
  "Is this deployment timeline believable?",
  "Is this worth deeper diligence?",
  "Is this partner/customer credible?",
  "What questions should we ask next?",
];

const userTypes = [
  "Fuel-cycle supplier",
  "Reactor developer",
  "Strategic partner / incumbent",
  "Data center power buyer",
  "Investor",
];

export function IntakeForm({
  counterparty,
  setCounterparty,
  decisionQuestion,
  setDecisionQuestion,
  userType,
  setUserType,
  sanitizedNotes,
  setSanitizedNotes,
  isLoading,
  onGenerate,
}: {
  counterparty: string;
  setCounterparty: (value: string) => void;
  decisionQuestion: string;
  setDecisionQuestion: (value: string) => void;
  userType: string;
  setUserType: (value: string) => void;
  sanitizedNotes: string;
  setSanitizedNotes: (value: string) => void;
  isLoading: boolean;
  onGenerate: () => void;
}) {
  return (
    <section className="border border-[#d9d3c8] bg-[#fbfaf7] p-6 sm:p-8">
      <div className="grid gap-5">
        <label className="grid gap-2">
          <span className="text-base font-semibold text-[#292824]">Company / project name</span>
          <input
            value={counterparty}
            onChange={(event) => setCounterparty(event.target.value)}
            placeholder="Example: Aurora Advanced Power AAP-80"
            className="border border-[#bfb6a7] bg-white px-4 py-4 text-base outline-none focus:border-[#151514]"
          />
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-base font-semibold text-[#292824]">User type</span>
            <select
              value={userType}
              onChange={(event) => setUserType(event.target.value)}
              className="border border-[#bfb6a7] bg-white px-4 py-4 text-base outline-none focus:border-[#151514]"
            >
              {userTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-base font-semibold text-[#292824]">Decision question</span>
            <select
              value={decisionQuestion}
              onChange={(event) => setDecisionQuestion(event.target.value)}
              className="border border-[#bfb6a7] bg-white px-4 py-4 text-base outline-none focus:border-[#151514]"
            >
              {decisionQuestions.map((question) => (
                <option key={question}>{question}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-base font-semibold text-[#292824]">Public claim or sanitized note</span>
          <textarea
            value={sanitizedNotes}
            onChange={(event) => setSanitizedNotes(event.target.value)}
            placeholder="Example: Company X claims it can deploy a 300 MW SMR campus by 2031 using HALEU fuel, with data center offtake and NRC engagement underway."
            className="min-h-32 resize-y border border-[#bfb6a7] bg-white px-4 py-4 text-base leading-7 outline-none focus:border-[#151514]"
          />
        </label>

        <button
          className="inline-flex w-full items-center justify-center gap-2 bg-[#151514] px-6 py-4 text-base font-semibold text-white sm:w-auto"
          onClick={onGenerate}
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
          Generate first-pass diligence memo
        </button>
      </div>
    </section>
  );
}
