import fs from "node:fs";
import path from "node:path";
import { loadDocumentManifest } from "./loadDocumentManifest";
import type { DocumentChunk, DocumentCoverageByLayer, DocumentCoverageStatus, DocumentManifestItem, RankedChunk, RankedDocument, TargetSpecificSupport } from "./documentTypes";
import type { DeploymentLayerFinding, DetectedClaim } from "@/types/core";

const chunksPath = path.join(process.cwd(), "corpus", "chunks", "document_chunks.jsonl");

const layerAliases: Record<string, string[]> = {
  "Interconnection / power delivery": ["Power delivery / interconnection", "Interconnection / power delivery", "co-location", "colocation", "large load"],
  "Offtake / customer": ["Offtake / customer", "Offtake / customer credibility", "customer agreement", "PPA", "power purchase", "strategic partner/customer"],
  Financing: ["Financing", "Financing / bankability", "loan guarantee", "Title 17", "capital", "bankability"],
  "Fuel supply / HALEU": ["Fuel supply / HALEU", "HALEU", "high assay", "allocation", "enrichment", "first core", "reload"],
  "Fuel fabrication": ["Fuel fabrication", "TRISO-X", "fuel fabrication", "qualification", "fabrication facility"],
  "Transportation / safeguards": ["Transportation / safeguards", "transportation", "criticality", "security", "safeguards", "package"],
  "Licensing / NRC": ["Licensing / NRC", "NRC", "preapplication", "pre-application", "readiness", "ARCAP", "RAI", "Regulatory Guide", "construction permit", "safety evaluation"],
  "Site / permitting": ["Site / permitting", "environmental impact", "EIS", "NEPA", "site", "permit"],
  "EPC / construction": ["EPC / construction", "construction", "EPC", "Vogtle", "construction monitoring"],
  "Bridge power / phased energization": ["Bridge power / phased energization", "initial energization", "bridge power", "phased"],
  "Operations / waste": ["Operations / waste", "operations", "waste", "spent fuel", "restart"],
};

const claimTerms: Record<string, string[]> = {
  data_center_power_claim: ["data center", "hyperscaler", "large load", "co-location", "colocation", "Amazon", "Microsoft", "Susquehanna", "Crane"],
  behind_the_meter_claim: ["behind the meter", "co-location", "colocation", "interconnection", "islanded", "physical separation"],
  fuel_cycle_claim: ["fuel cycle", "fuel fabrication", "TRISO-X", "criticality", "transportation", "HALEU"],
  HALEU_claim: ["HALEU", "high assay", "allocation", "enrichment", "Centrus", "first core", "reload", "criticality", "transportation"],
  licensing_claim: ["NRC", "licensing", "construction permit", "Regulatory Guide", "ARCAP", "RAI", "safety evaluation"],
  NRC_engagement_claim: ["NRC", "preapplication", "pre-application", "readiness", "LIC-116", "RAI", "ARCAP"],
  deployment_timeline_claim: ["readiness", "RAI", "construction permit", "safety evaluation", "application", "EPC", "financing"],
  offtake_claim: ["offtake", "customer", "PPA", "power purchase", "Amazon", "Microsoft", "Constellation", "Talen"],
  site_control_claim: ["site", "permitting", "EIS", "NEPA", "environmental"],
  financing_claim: ["financing", "Title 17", "loan guarantee", "LPO", "bankability", "capital"],
  EPC_construction_claim: ["EPC", "construction", "Vogtle", "construction monitoring", "contractor"],
  bridge_power_claim: ["bridge power", "initial energization", "phased", "gas", "turbine"],
  nuclear_integration_claim: ["reactor", "nuclear", "SMR", "advanced reactor", "licensing", "fuel"],
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function hasOverlap(left: string, right: string) {
  const a = normalize(left);
  const b = normalize(right);
  return a.includes(b) || b.includes(a);
}

function layerMatches(documentLayer: string, layer: string) {
  const aliases = [layer, ...(layerAliases[layer] ?? [])];
  return aliases.some((alias) => hasOverlap(documentLayer, alias));
}

function textForDocument(document: DocumentManifestItem) {
  return [document.title, document.document_family, document.why_it_matters, document.suggested_chunking_strategy, ...document.memo_sections_supported, ...document.deployment_layers].join(" ");
}

function textForChunk(chunk: DocumentChunk) {
  return [chunk.title, chunk.document_family, chunk.text, ...chunk.memo_sections_supported, ...chunk.deployment_layers].join(" ");
}

function matchedClaimTypes(text: string, claims: DetectedClaim[]) {
  const normalizedText = normalize(text);
  return claims
    .filter((claim) => {
      const terms = [...(claimTerms[claim.claimType] ?? []), claim.label, ...claim.triggeredKeywords].map(normalize).filter(Boolean);
      return terms.some((term) => normalizedText.includes(term));
    })
    .map((claim) => claim.claimType);
}

function scoreBase(rank: number, benchmarkValue: string, includedIn?: string[]) {
  const rankBoost = Math.max(0, 151 - rank) / 25;
  const benchmarkBoost = benchmarkValue === "strong" ? 5 : benchmarkValue === "moderate" ? 2.5 : 1;
  const tierBoost = includedIn?.includes("top_25_one_day_prototype") ? 4 : includedIn?.includes("top_75_credible_mvp") ? 2 : 0.5;
  return rankBoost + benchmarkBoost + tierBoost;
}

function scoreDocument(document: DocumentManifestItem, claims: DetectedClaim[], layers: string[]): RankedDocument {
  const matchedLayers = layers.filter((layer) => document.deployment_layers.some((docLayer) => layerMatches(docLayer, layer)) || layerAliases[layer]?.some((alias) => hasOverlap(textForDocument(document), alias)));
  const matchedClaims = matchedClaimTypes(textForDocument(document), claims);
  const relevance_score = matchedLayers.length * 7 + matchedClaims.length * 5 + scoreBase(document.rank, document.benchmark_value, document.included_in);
  return { ...document, relevance_score, matched_layers: matchedLayers, matched_claim_types: matchedClaims };
}

function excerptFrom(text: string) {
  const sentences = text.replace(/\s+/g, " ").match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text];
  return sentences.slice(0, 4).join(" ").trim().slice(0, 900);
}

function scoreChunk(chunk: DocumentChunk, claims: DetectedClaim[], layers: string[]): RankedChunk {
  const text = textForChunk(chunk);
  const matchedLayers = layers.filter((layer) => chunk.deployment_layers.some((docLayer) => layerMatches(docLayer, layer)) || layerAliases[layer]?.some((alias) => hasOverlap(text, alias)));
  const matchedClaims = matchedClaimTypes(text, claims);
  const relevance_score = matchedLayers.length * 8 + matchedClaims.length * 6 + scoreBase(chunk.rank, chunk.benchmark_value);
  return { ...chunk, relevance_score, matched_layers: matchedLayers, matched_claim_types: matchedClaims, excerpt: excerptFrom(chunk.text) };
}

function corpusCoverage(docs: RankedDocument[], chunks: RankedChunk[]): DocumentCoverageStatus {
  if (chunks.length >= 3 || docs.filter((doc) => doc.benchmark_value === "strong").length >= 2) return "Strong";
  if (chunks.length >= 1 || docs.length >= 3 || docs.some((doc) => doc.benchmark_value === "strong")) return "Partial";
  if (docs.length >= 1) return "Thin";
  return "Missing";
}

function targetSupport(status?: DeploymentLayerFinding["status"]): TargetSpecificSupport {
  if (status === "evidenced") return "Supported";
  if (status === "plausible") return "Partially supported";
  if (status === "private diligence required") return "Private diligence required";
  if (status === "cannot know from public docs") return "Cannot know from public docs";
  return "Missing";
}

function conclusion(layer: string, coverage: DocumentCoverageStatus, support: TargetSpecificSupport) {
  if (coverage !== "Missing" && support === "Missing") return `The corpus has ${coverage.toLowerCase()} ${layer} context, but the target has not provided project-specific evidence.`;
  if (coverage !== "Missing" && support === "Private diligence required") return `The corpus has ${coverage.toLowerCase()} ${layer} context, but target-specific proof depends on private diligence.`;
  if (coverage === "Missing") return `The current chunked/manifest corpus has no strong ${layer} coverage for this claim.`;
  return `Corpus coverage is ${coverage.toLowerCase()}; target-specific support is ${support.toLowerCase()}.`;
}

function loadChunks(): DocumentChunk[] {
  if (!fs.existsSync(chunksPath)) return [];
  return fs.readFileSync(chunksPath, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as DocumentChunk);
}

export function rankDocumentsForClaim(input: {
  detectedClaims: DetectedClaim[];
  deploymentLayerFindings: DeploymentLayerFinding[];
  limit?: number;
}) {
  const documents = loadDocumentManifest();
  const chunks = loadChunks();
  const layers = input.deploymentLayerFindings.map((finding) => finding.layer);
  const rankedDocuments = documents
    .map((document) => scoreDocument(document, input.detectedClaims, layers))
    .filter((document) => document.relevance_score > 0 && (document.matched_layers.length > 0 || document.matched_claim_types.length > 0))
    .sort((a, b) => b.relevance_score - a.relevance_score || a.rank - b.rank);
  const rankedChunks = chunks
    .map((chunk) => scoreChunk(chunk, input.detectedClaims, layers))
    .filter((chunk) => chunk.relevance_score > 0 && (chunk.matched_layers.length > 0 || chunk.matched_claim_types.length > 0))
    .sort((a, b) => b.relevance_score - a.relevance_score || a.rank - b.rank || a.chunk_index - b.chunk_index);

  const documentCoverage = layers.map((layer) => {
    const topDocuments = rankedDocuments.filter((document) => document.matched_layers.includes(layer)).slice(0, 3);
    const topChunks = rankedChunks.filter((chunk) => chunk.matched_layers.includes(layer)).slice(0, 3);
    const corpus = corpusCoverage(topDocuments, topChunks);
    const support = targetSupport(input.deploymentLayerFindings.find((finding) => finding.layer === layer)?.status);
    return {
      layer,
      corpusCoverage: corpus,
      targetSpecificSupport: support,
      conclusion: conclusion(layer, corpus, support),
      matchedCount: rankedDocuments.filter((document) => document.matched_layers.includes(layer)).length,
      topDocuments,
    } satisfies DocumentCoverageByLayer;
  });
  const chunkDocumentRanks = new Set(rankedChunks.map((chunk) => chunk.rank));

  return {
    relevantDocuments: rankedDocuments.slice(0, input.limit ?? 8),
    manifestOnlyDocuments: rankedDocuments.filter((document) => !chunkDocumentRanks.has(document.rank)).slice(0, 3),
    chunkEvidence: rankedChunks.slice(0, 6),
    documentCoverage,
  };
}
