export const sourceCategories = [
  "NRC / licensing",
  "DOE / HALEU",
  "Fuel-cycle / fabrication",
  "Financing / DOE LPO",
  "Interconnection / FERC / ISO",
  "Siting / permitting",
  "Offtake / commercial",
  "EPC / construction",
  "Company filings / investor materials",
  "Public benchmarks",
] as const;

export type SourceAgency = "NRC" | "DOE" | "FERC" | "ISO/RTO" | "Company" | "State/Local" | "Other";

export type SourceCategory = (typeof sourceCategories)[number];

export type SourceDocType =
  | "overview"
  | "guidance"
  | "project_page"
  | "process"
  | "program"
  | "benchmark"
  | "fuel_cycle"
  | "filing"
  | "market_rule"
  | "permit"
  | "commercial_signal";

export type RelevanceModule =
  | "licensing_path"
  | "fuel_supply_haleu"
  | "fuel_fabrication"
  | "transportation_safeguards_storage"
  | "site_permitting"
  | "interconnection_power_delivery"
  | "bridge_power_phased_energization"
  | "commercial_offtake"
  | "epc_construction"
  | "financing"
  | "operations_waste"
  | "timeline_credibility"
  | "benchmark_precedent";

export type CoverageStatus = "covered" | "partial" | "missing" | "private diligence required" | "cannot know from public docs";

export interface DeploymentLayerCoverageItem {
  id: RelevanceModule;
  layer: string;
  status: CoverageStatus;
  note: string;
}

export interface CorpusSource {
  id: string;
  source_name: string;
  source_url: string;
  agency: SourceAgency;
  source_category: SourceCategory;
  doc_type: SourceDocType;
  date_or_status: string;
  topic_tags: string[];
  relevance_modules: RelevanceModule[];
  why_it_matters: string;
}

export interface CorpusChunk extends CorpusSource {
  title: string;
  text: string;
}

export interface SearchCorpusOptions {
  query?: string;
  tags?: string[];
  sourceCategories?: SourceCategory[];
  relevanceModules?: RelevanceModule[];
  limit?: number;
}

export type SourceCoverage = DeploymentLayerCoverageItem[];
