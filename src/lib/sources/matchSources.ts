import sourceNotesJson from "../../../data/source_notes.sample.json";
import { deploymentLayers, type DeploymentLayer, type EvidenceCoverageStatus, type SourceMatchResult, type SourceNote } from "./sourceTypes";
import type { CompanyProfile, DeploymentLayerFinding, DetectedClaim } from "@/types/core";

export interface SourceMatchInput {
  companyProfile?: CompanyProfile;
  detectedClaims: DetectedClaim[];
  deploymentLayerFindings: DeploymentLayerFinding[];
  userType: string;
  decisionQuestion: string;
}

const sourceNotes = sourceNotesJson as SourceNote[];

const privateByNature = new Set<DeploymentLayer>(["Offtake / customer", "EPC / construction", "Financing"]);

const sourceTypePriority: Record<string, number> = {
  "NRC RAI / review precedent": 1.5,
  "NRC pre-application": 1,
  "DOE HALEU": 1.5,
  "DOE financing": 1.5,
  "fuel fabrication": 1.5,
  "public benchmark": 2,
  "company filing": 1,
};

const strengthScore: Record<string, number> = {
  strong: 2,
  moderate: 1.25,
  weak: 0.5,
  contextual: 0.25,
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function overlap<T extends string>(a: T[], b: T[]) {
  const right = new Set(b.map((item) => normalize(item)));
  return a.filter((item) => right.has(normalize(item)));
}

function implicatedLayers(findings: DeploymentLayerFinding[]) {
  const layers = findings.map((finding) => finding.layer).filter((layer): layer is DeploymentLayer => deploymentLayers.includes(layer as DeploymentLayer));
  return layers.length ? layers : [...deploymentLayers];
}

function companyTerms(profile?: CompanyProfile) {
  if (!profile) return [];
  return [profile.name, profile.category, ...profile.aliases, ...profile.deployment_relevance];
}

function scoreNote(note: SourceNote, input: SourceMatchInput) {
  const layers = implicatedLayers(input.deploymentLayerFindings);
  const claimTypes = input.detectedClaims.map((claim) => claim.claimType);
  const claimLabels = input.detectedClaims.map((claim) => claim.label);
  const topicTerms = [input.userType, input.decisionQuestion, ...claimLabels, ...claimTypes].map(normalize);
  let score = 0;

  score += overlap(note.deployment_layers, layers).length * 4;
  score += overlap(note.claim_types_relevant, claimTypes).length * 3;
  score += overlap(note.companies_relevant, companyTerms(input.companyProfile)).length * 4;
  score += note.topic_tags.filter((tag) => topicTerms.some((term) => term.includes(normalize(tag)) || normalize(tag).includes(term))).length;
  score += sourceTypePriority[note.source_type] ?? 0;
  score += strengthScore[note.evidence_strength] ?? 0;

  if (note.source_type === "public benchmark" && overlap(note.deployment_layers, layers).length) score += 2;
  return score;
}

function statusForLayer(layer: DeploymentLayer, supporting: SourceNote[], finding?: DeploymentLayerFinding): EvidenceCoverageStatus {
  if (layer === "Operations / waste" && !supporting.length) return "Cannot know from public docs";
  if (privateByNature.has(layer)) {
    if (!supporting.length) return "Private diligence required";
    return supporting.some((note) => note.evidence_strength === "strong") ? "Partial" : "Private diligence required";
  }
  if (!supporting.length) return finding?.status === "private diligence required" ? "Private diligence required" : "Missing";
  const strongOrModerate = supporting.filter((note) => note.evidence_strength === "strong" || note.evidence_strength === "moderate").length;
  return strongOrModerate >= 2 ? "Covered" : "Partial";
}

function noteForLayer(layer: DeploymentLayer, status: EvidenceCoverageStatus, supporting: SourceNote[]) {
  if (!supporting.length) {
    if (status === "Private diligence required") return `${layer} is mainly verifiable through counterparty documents, contracts, or permissioned diligence.`;
    if (status === "Cannot know from public docs") return `${layer} cannot be resolved from public documents in the current seed corpus.`;
    return "No public source in the current corpus supports this claim. Treat as unsupported unless the counterparty provides evidence.";
  }

  const lead = supporting[0];
  if (status === "Covered") return `Public source notes cover this layer, led by ${lead.title}. Coverage establishes context or precedent, not project-specific bankability.`;
  if (status === "Partial") return `${lead.title} provides relevant public context, but does not establish the target-specific evidence needed to underwrite this layer.`;
  return `${lead.title} is relevant context, but private diligence is still required for binding commitments and allocation of risk.`;
}

function confidenceFor(coverage: Array<{ status: EvidenceCoverageStatus; layer: DeploymentLayer }>) {
  const missing = coverage.filter((item) => item.status === "Missing").length;
  const privateOrCannot = coverage.filter((item) => item.status === "Private diligence required" || item.status === "Cannot know from public docs").length;
  const coveredOrPartial = coverage.filter((item) => item.status === "Covered" || item.status === "Partial").length;
  const commercialGap = coverage.some((item) => item.layer === "Offtake / customer" && item.status !== "Covered");

  if (missing + privateOrCannot >= Math.max(4, Math.ceil(coverage.length / 2))) {
    return {
      confidence: "Low" as const,
      rationale: "Low confidence in project outcome due to limited public source coverage and major private diligence gaps. Confidence in the concern is higher than confidence in the deployment claim.",
    };
  }

  if (coveredOrPartial >= 3 || commercialGap) {
    return {
      confidence: "Medium" as const,
      rationale: commercialGap
        ? "Medium confidence: public regulatory, fuel, or benchmark evidence may exist, but customer/offtake, EPC, or financing proof remains private or missing."
        : "Medium confidence: the seed corpus supports several deployment layers, but target-specific evidence remains incomplete.",
    };
  }

  return {
    confidence: "Low" as const,
    rationale: "Low confidence due to thin public source coverage in the current seed corpus.",
  };
}

export function matchSources(input: SourceMatchInput): SourceMatchResult {
  const scored = sourceNotes
    .map((note) => ({ note, score: scoreNote(note, input) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  const relevantSourceNotes = scored.slice(0, 8).map((item) => item.note);
  const layers = implicatedLayers(input.deploymentLayerFindings);

  const sourceCoverageByLayer = layers.map((layer) => {
    const supporting = relevantSourceNotes.filter((note) => note.deployment_layers.includes(layer));
    const finding = input.deploymentLayerFindings.find((item) => item.layer === layer);
    const status = statusForLayer(layer, supporting, finding);
    return {
      layer,
      status,
      supporting_source_ids: supporting.map((note) => note.id),
      note: noteForLayer(layer, status, supporting),
    };
  });

  const unsupportedLayers = sourceCoverageByLayer.filter((item) => item.status === "Missing").map((item) => item.layer);
  const privateDiligenceLayers = sourceCoverageByLayer
    .filter((item) => item.status === "Private diligence required" || item.status === "Cannot know from public docs")
    .map((item) => item.layer);
  const confidence = confidenceFor(sourceCoverageByLayer);

  return {
    relevantSourceNotes: relevantSourceNotes.slice(0, 6),
    sourceCoverageByLayer,
    unsupportedLayers,
    privateDiligenceLayers,
    confidence: confidence.confidence,
    confidenceRationale: confidence.rationale,
  };
}
