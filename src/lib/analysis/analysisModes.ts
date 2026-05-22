import type { AppAnalysisMode } from "@/types/core";

export const analysisModeCopy: Record<AppAnalysisMode, { label: string; description: string; note: string }> = {
  demo: {
    label: "Demo Mode",
    description: "Deterministic templates, prefilled demo claims, curated source notes, no OpenAI calls.",
    note: "Demo mode uses deterministic templates and curated source notes. No OpenAI calls are made.",
  },
  source_grounded_scaffold: {
    label: "Source-Grounded Analysis Mode",
    description: "Scaffold only: claim extraction -> source retrieval -> evidence classification -> memo synthesis.",
    note: "Source-grounded analysis mode is scaffolded only. The current response still uses deterministic memo templates while the architecture prepares for cited analysis.",
  },
};

export const sourceGroundedPipeline = [
  "claim extraction",
  "source retrieval",
  "evidence classification",
  "memo synthesis",
] as const;
