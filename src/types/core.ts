export type EvidenceStatus =
  | "public_source_verified"
  | "sanitized_user_note"
  | "uploaded_document_claimed"
  | "internal_source_verified"
  | "inferred"
  | "missing"
  | "unknowable_from_public_docs";

export type ReadinessBand = "credible" | "conditional" | "speculative" | "not_ready";

export type UserMode = "fuel-cycle supplier" | "incumbent / strategic partner" | "investor" | "developer";

export type InputMode = "public-source project profile" | "sanitized note / non-confidential memo" | "demo profile";

export type DealUserType = "Investor" | "Fuel-cycle supplier" | "Strategic partner / incumbent" | "Data center power buyer" | "Reactor developer";

export type DecisionType =
  | "Is this a credible fuel-cycle customer?"
  | "Is this deployment timeline believable?"
  | "Is this worth deeper diligence?"
  | "Is this partner/customer credible?"
  | "What questions should we ask next?";

export type DealVerdict = "Pursue" | "Monitor" | "Pass" | "Diligence Required";

export type MustBeTrueStatus = "evidenced" | "plausible" | "unsupported" | "private diligence required" | "red flag";

export type AppAnalysisMode = "demo" | "source_grounded_scaffold";

export type CoverageStatus =
  | "covered"
  | "partial"
  | "missing"
  | "private diligence required"
  | "cannot know from public docs"
  | "Covered"
  | "Partial"
  | "Missing"
  | "Private diligence required"
  | "Cannot know from public docs";

export interface AnalysisInput {
  targetCompanyProject: string;
  note: string;
  userType: string;
  decisionQuestion: string;
  analysisMode?: AppAnalysisMode;
}

export interface DetectedClaim {
  claimType: string;
  label: string;
  triggeredKeywords: string[];
  deploymentLayers: string[];
}

export interface CompanyProfile {
  name: string;
  aliases: string[];
  category: string;
  deployment_relevance: string[];
  default_user_types: string[];
  likely_claim_types: string[];
  key_bottlenecks: string[];
  default_diligence_questions: string[];
  what_to_diligence_next: string;
}

export interface DeploymentLayerFinding {
  layer: string;
  status: "evidenced" | "plausible" | "unsupported" | "private diligence required" | "cannot know from public docs";
  finding: string;
  whyItMatters: string;
  requiredEvidence: string;
}


export type AtomicClaimTargetSpecificity = "target_specific" | "general_market_claim" | "precedent_claim" | "unclear";

export type AtomicClaimEvidenceStatus =
  | "supported_by_public_source"
  | "partially_supported_by_public_source"
  | "user_note_only"
  | "inferred"
  | "missing"
  | "private_diligence_required"
  | "cannot_know_from_public_docs";

export interface MatchedChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  rank: number;
  deploymentLayers: string[];
  excerpt: string;
  relevanceReason: string;
  doesNotProve: string;
}

export interface AtomicClaim {
  id: string;
  text: string;
  claimType: string;
  deploymentLayers: string[];
  triggeredBy: string[];
  targetSpecificity: AtomicClaimTargetSpecificity;
  evidenceStatus: AtomicClaimEvidenceStatus;
  confidence: "high" | "medium" | "low";
  requiredEvidence: string;
  whyItMatters: string;
  matchedChunks: MatchedChunk[];
  matchedManifestDocs: MemoRelevantDocument[];
  whatThisDoesNotProve: string;
}

export interface EvidenceLedger {
  atomicClaims: AtomicClaim[];
  deploymentLayerSummary: MemoDocumentCoverageItem[];
  topMissingEvidence: string[];
  privateDiligenceRequired: string[];
  whatWouldChangeVerdict: string[];
}

export interface AnalysisDebug {
  detectedCompanyProfile: string | null;
  companyCategory: string;
  detectedClaimTypes: string[];
  triggeredKeywords: Record<string, string[]>;
  deploymentLayersImplicated: string[];
  selectedMemoTemplate: string;
}

export interface MemoResult {
  verdict: DealVerdict;
  confidence: "High" | "Medium" | "Low";
  confidenceRationale?: string;
  oneLineJudgment: string;
  recommendedNextAction: string;
  detectedClaims: DetectedClaim[];
  deploymentLayerFindings: DeploymentLayerFinding[];
  sourceCoverage?: MemoSourceCoverage;
  relevantPublicEvidenceNotes?: PublicEvidenceNote[];
  relevantDocuments?: MemoRelevantDocument[];
  manifestOnlyDocuments?: MemoRelevantDocument[];
  chunkEvidence?: MemoChunkEvidence[];
  documentCoverage?: MemoDocumentCoverageItem[];
  evidenceLedger?: EvidenceLedger;
  unsupportedLayers?: string[];
  privateDiligenceLayers?: string[];
  firstPassIcMemo: FirstPassIcMemo;
  debug: AnalysisDebug;
}

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
  whyItMatters: string;
  whoShouldAnswer: string;
  requiredEvidence: string;
  evidenceTier: EvidenceStatus;
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
  priority: "must-answer" | "important" | "monitor";
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

export interface UnsupportedClaim {
  id: string;
  claim: string;
  evidenceTier: EvidenceStatus;
  whyItMatters: string;
  requiredEvidence: string;
}

export interface DomainAssessment {
  title: string;
  assessment: string;
  evidenceTier: EvidenceStatus;
}

export interface MustBeTrueItem {
  id: string;
  statement: string;
  status: MustBeTrueStatus;
  whyItMatters: string;
  requiredEvidence: string;
}

export interface ComparablePrecedent {
  companyOrProject: string;
  relevance: string;
}

export interface PublicEvidenceNote {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  agency: string;
  sourceCategory: string;
  relevance: string;
  organization?: string;
  sourceType?: string;
  whatItEstablishes?: string;
  whatItDoesNotEstablish?: string;
  whyItMatters?: string;
  evidenceStrength?: "strong" | "moderate" | "weak" | "contextual";
  dateOrStatus?: string;
}

export interface MemoSourceCoverageItem {
  id: string;
  layer: string;
  status: CoverageStatus;
  note: string;
}

export type MemoSourceCoverage = MemoSourceCoverageItem[];

export interface MemoRelevantDocument {
  rank: number;
  title: string;
  url: string;
  adamsAccession?: string;
  documentFamily: string;
  deploymentLayers: string[];
  whyItMatters: string;
  memoSectionsSupported: string[];
  benchmarkValue: "strong" | "moderate" | "weak";
  suggestedChunkingStrategy: string;
  validationStatus?: "valid" | "failed" | "unchecked";
  httpStatus?: number | null;
  contentType?: string;
  validationError?: string;
}

export interface MemoDocumentCoverageItem {
  layer: string;
  corpusCoverage: "Strong" | "Partial" | "Thin" | "Missing";
  targetSpecificSupport: "Supported" | "Partially supported" | "Missing" | "Private diligence required" | "Cannot know from public docs";
  conclusion: string;
  matchedCount: number;
  topDocuments: MemoRelevantDocument[];
}

export interface MemoChunkEvidence {
  chunkId: string;
  documentId: string;
  rank: number;
  title: string;
  sourceUrl: string;
  documentFamily: string;
  deploymentLayers: string[];
  memoSectionsSupported: string[];
  benchmarkValue: "strong" | "moderate" | "weak";
  chunkIndex: number;
  text: string;
  wordCount: number;
  tokenEstimate: number;
  matchedLayer: string;
  excerpt: string;
  whyItMatters: string;
  whatItDoesNotProve: string;
}

export interface FirstPassIcMemo {
  target: string;
  decision: string;
  userType?: string;
  verdict: DealVerdict;
  confidence: "High" | "Medium" | "Low";
  situation: string;
  thesis: string;
  whatIsEvidenced: string[];
  whatIsNotYetEvidenced: string[];
  majorKillRisks: string[];
  whatMustBeTrue: string[];
  diligenceQuestions: string[];
  recommendedNextStep: string;
  sourcesAndEvidenceNotes: string[];
}

export interface ClaimToIcMemo {
  verdict: DealVerdict;
  confidence: "High" | "Medium" | "Low";
  oneLineJudgment: string;
  recommendedNextAction: string;
  unsupportedClaims: UnsupportedClaim[];
  timelineCredibility: DomainAssessment;
  fuelCycleReadiness: DomainAssessment;
  regulatoryMaturity: DomainAssessment;
  commercialOfftakeCredibility: DomainAssessment;
  whatMustBeTrue: MustBeTrueItem[];
  relevantPrecedents: ComparablePrecedent[];
  publicEvidenceNotes?: PublicEvidenceNote[];
  sourceCoverage?: MemoSourceCoverage;
  relevantDocuments?: MemoRelevantDocument[];
  manifestOnlyDocuments?: MemoRelevantDocument[];
  chunkEvidence?: MemoChunkEvidence[];
  documentCoverage?: MemoDocumentCoverageItem[];
  evidenceLedger?: EvidenceLedger;
  unsupportedLayers?: string[];
  privateDiligenceLayers?: string[];
  confidenceRationale?: string;
  detectedClaims?: DetectedClaim[];
  deploymentLayerFindings?: DeploymentLayerFinding[];
  analysisDebug?: AnalysisDebug;
  analysisMode?: AppAnalysisMode;
  analysisModeNote?: string;
  firstPassIcMemo: FirstPassIcMemo;
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
  cannotKnowFromPublicDocs: string[];
  recommendedAction: RecommendedAction;
  memo: MemoSection[];
  sources: EvidenceRef[];
  claimToIcMemo: ClaimToIcMemo;
}
