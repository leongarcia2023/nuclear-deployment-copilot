import type { AppAnalysisMode } from "@/types/core";

export const analysisModeCopy: Record<AppAnalysisMode, { label: string; description: string; note: string }> = {
  demo: {
    label: "Demo Mode",
    description: "Deterministic templates, prefilled demo claims, curated source notes, no OpenAI calls.",
    note: "Demo mode uses deterministic templates and curated source notes. No OpenAI calls are made.",
  },
  source_grounded_scaffold: {
    label: "Source-Grounded Analysis Mode",
    description: "Retrieves from the chunked corpus and classifies evidence by deployment layer.",
    note: "Source-grounded analysis retrieves from the chunked corpus, classifies evidence by deployment layer, and keeps memo synthesis deterministic in this version.",
  },
};

export const sourceGroundedPipeline = [
  "claim extraction",
  "source retrieval",
  "evidence classification",
  "memo synthesis",
] as const;
