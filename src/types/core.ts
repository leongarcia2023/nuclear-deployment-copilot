export type EvidenceStatus =
  | "public_source_verified"
  | "uploaded_document_claimed"
  | "internal_source_verified"
  | "inferred"
  | "missing"
  | "unknowable_from_public_docs";

export type ReadinessBand = "credible" | "conditional" | "speculative" | "not_ready";

export type UserMode = "fuel-cycle supplier" | "incumbent / strategic partner" | "investor" | "developer";

export interface EvidenceRef {
  id: string;
  title: string;
  sourceType: EvidenceStatus;
  publisher: string;
  date: string;
  url?: string;
  excerpt: string;
  confidence: "high" | "medium" | "low";
}

export interface ProvenancedValue<T> {
  value: T;
  status: EvidenceStatus;
  evidenceIds: string[];
  note?: string;
}

export interface ReadinessScore {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  band: ReadinessBand;
  status: EvidenceStatus;
  rationale: string;
  evidenceIds: string[];
}

export interface FuelCycleDependency {
  id: string;
  dependency: string;
  needBy: string;
  exposure: "low" | "medium" | "high" | "critical";
  status: EvidenceStatus;
  currentEvidence: string;
  proofNeeded: string;
  evidenceIds: string[];
}

export interface EvidenceQualityItem {
  id: string;
  claim: string;
  status: EvidenceStatus;
  sourceIds: string[];
  quality: "strong" | "adequate" | "thin" | "absent";
  diligenceImplication: string;
}

export interface UnknownItem {
  id: string;
  unknown: string;
  status: EvidenceStatus;
  severity: "low" | "medium" | "high";
  owner: string;
  nextStep: string;
}

export interface CounterpartyQuestion {
  id: string;
  question: string;
  whyItMatters: string;
  expectedEvidence: string;
  priority: "must-answer" | "important" | "watchlist";
  status: EvidenceStatus;
}

export interface RecommendedAction {
  decision: "advance diligence" | "advance with conditions" | "monitor only" | "decline";
  status: EvidenceStatus;
  rationale: string;
  conditions: string[];
  nextReviewTrigger: string;
}

export interface MemoSection {
  heading: string;
  body: string;
  status: EvidenceStatus;
  evidenceIds: string[];
}

export interface ProjectCounterpartyProfile {
  id: string;
  projectName: string;
  companyName: string;
  uploadedMemoTitle: string;
  userModeDefault: UserMode;
  oneLineAssessment: ProvenancedValue<string>;
  readinessBand: ReadinessBand;
  readinessScore: number;
  assessmentDate: string;
  profileHeader: {
    reactorType: ProvenancedValue<string>;
    fuelNeed: ProvenancedValue<string>;
    firstFuelDate: ProvenancedValue<string>;
    deploymentSite: ProvenancedValue<string>;
    commercialStage: ProvenancedValue<string>;
  };
  readinessScores: ReadinessScore[];
  fuelCycleDependencies: FuelCycleDependency[];
  evidenceQuality: EvidenceQualityItem[];
  unknowns: UnknownItem[];
  counterpartyQuestions: CounterpartyQuestion[];
  recommendedAction: RecommendedAction;
  memo: MemoSection[];
  sources: EvidenceRef[];
}
