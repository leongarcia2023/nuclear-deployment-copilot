import type { EvidenceRef, EvidenceStatus } from "./core";

export interface SourceManifest {
  corpusId: string;
  generatedAt: string;
  sources: EvidenceRef[];
}

export interface RiskTaxonomyItem {
  id: string;
  category: string;
  label: string;
  description: string;
  negativeSignals: string[];
  proofSignals: string[];
  defaultStatus: EvidenceStatus;
}

export interface RiskTaxonomy {
  taxonomyId: string;
  items: RiskTaxonomyItem[];
}
