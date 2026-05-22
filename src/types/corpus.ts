import type { EvidenceRef, EvidenceStatus } from "./core";
import type { CorpusChunk as PublicCorpusChunk, CorpusSource, RelevanceModule, SourceCategory, SourceCoverage } from "@/lib/corpus/sourceTypes";

export interface SourceManifest {
  corpusId: string;
  generatedAt: string;
  scope?: string;
  sources: Array<CorpusSource | EvidenceRef>;
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

export type CorpusChunk = PublicCorpusChunk;
export type { CorpusSource, RelevanceModule, SourceCategory, SourceCoverage };
