export type BenchmarkValue = "strong" | "moderate" | "weak";
export type UrlStatus = "valid" | "failed" | "unchecked";
export type DocumentCoverageStatus = "Strong" | "Partial" | "Thin" | "Missing";
export type TargetSpecificSupport = "Supported" | "Partially supported" | "Missing" | "Private diligence required" | "Cannot know from public docs";

export interface DocumentManifestItem {
  rank: number;
  included_in: string[];
  title: string;
  url: string;
  adams_accession?: string;
  document_family: string;
  deployment_layers: string[];
  why_it_matters: string;
  memo_sections_supported: string[];
  benchmark_value: BenchmarkValue;
  suggested_chunking_strategy: string;
  url_status?: UrlStatus;
  http_status?: number | null;
  content_type?: string;
  validation_error?: string;
}

export interface DocumentValidationRecord {
  rank: number;
  title: string;
  url: string;
  url_status: UrlStatus;
  http_status: number | null;
  content_type: string;
  validation_error: string;
}

export interface RankedDocument extends DocumentManifestItem {
  relevance_score: number;
  matched_layers: string[];
  matched_claim_types: string[];
}

export interface DocumentChunk {
  chunk_id: string;
  document_id: string;
  rank: number;
  title: string;
  source_url: string;
  document_family: string;
  deployment_layers: string[];
  memo_sections_supported: string[];
  benchmark_value: BenchmarkValue;
  chunk_index: number;
  text: string;
  word_count: number;
  token_estimate: number;
}

export interface RankedChunk extends DocumentChunk {
  relevance_score: number;
  matched_layers: string[];
  matched_claim_types: string[];
  excerpt: string;
}

export interface DocumentCoverageByLayer {
  layer: string;
  corpusCoverage: DocumentCoverageStatus;
  targetSpecificSupport: TargetSpecificSupport;
  conclusion: string;
  matchedCount: number;
  topDocuments: RankedDocument[];
}
