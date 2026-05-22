export const deploymentLayers = [
  "Licensing / NRC",
  "Fuel supply / HALEU",
  "Fuel fabrication",
  "Transportation / safeguards",
  "Site / permitting",
  "Interconnection / power delivery",
  "Bridge power / phased energization",
  "EPC / construction",
  "Offtake / customer",
  "Financing",
  "Operations / waste",
] as const;

export const sourceTypes = [
  "NRC licensing",
  "NRC pre-application",
  "NRC RAI / review precedent",
  "DOE HALEU",
  "DOE financing",
  "fuel fabrication",
  "transportation / safeguards",
  "storage / waste",
  "interconnection / power delivery",
  "offtake / commercial",
  "EPC / construction",
  "company filing",
  "public benchmark",
] as const;

export type SourceNoteType = (typeof sourceTypes)[number];
export type DeploymentLayer = (typeof deploymentLayers)[number];
export type EvidenceStrength = "strong" | "moderate" | "weak" | "contextual";
export type EvidenceCoverageStatus = "Covered" | "Partial" | "Missing" | "Private diligence required" | "Cannot know from public docs";

export interface SourceNote {
  id: string;
  title: string;
  organization: string;
  source_url: string;
  source_type: SourceNoteType;
  deployment_layers: DeploymentLayer[];
  topic_tags: string[];
  companies_relevant: string[];
  claim_types_relevant: string[];
  source_summary: string;
  what_it_establishes: string;
  what_it_does_not_establish: string;
  why_it_matters: string;
  evidence_strength: EvidenceStrength;
  date_or_status: string;
}

export interface SourceLayerCoverage {
  layer: DeploymentLayer;
  status: EvidenceCoverageStatus;
  supporting_source_ids: string[];
  note: string;
}

export interface SourceMatchResult {
  relevantSourceNotes: SourceNote[];
  sourceCoverageByLayer: SourceLayerCoverage[];
  unsupportedLayers: DeploymentLayer[];
  privateDiligenceLayers: DeploymentLayer[];
  confidence: "High" | "Medium" | "Low";
  confidenceRationale: string;
}
