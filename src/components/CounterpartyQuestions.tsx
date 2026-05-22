import type { CounterpartyQuestion } from "@/types/core";
import { SectionShell, statusLabel } from "./provenance";

const priorityLabel = {
  "must-answer": "Must answer",
  important: "Important",
  monitor: "Monitor",
};

export function CounterpartyQuestions({ questions }: { questions: CounterpartyQuestion[] }) {
  return (
    <SectionShell title="Questions for Next Counterparty Call" kicker="First-class output">
      <div className="grid gap-4 lg:grid-cols-2">
        {questions.map((question) => (
          <article key={question.id} className="border border-[#d9d3c8] bg-[#fbfaf7] p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-[#e6ded0] px-2.5 py-1 text-xs font-bold uppercase text-[#3f3d38]">
                {priorityLabel[question.priority]}
              </span>
              <span className="text-base font-semibold text-[#3f3d38]">{statusLabel(question.status)}</span>
            </div>
            <h3 className="text-xl font-semibold leading-7">{question.question}</h3>
            <p className="mt-4 text-sm leading-6 text-[#4a4842]">{question.whyItMatters}</p>
            <div className="mt-4 border-t border-[#d9d3c8] pt-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#63615b]">Expected evidence</p>
              <p className="mt-2 text-sm leading-6">{question.expectedEvidence}</p>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
