import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CorpusChunk, CoverageStatus, DeploymentLayerCoverageItem, RelevanceModule, SearchCorpusOptions, SourceCoverage } from "./sourceTypes";

let cachedChunks: CorpusChunk[] | null = null;

export async function loadCorpusChunks() {
  if (cachedChunks) return cachedChunks;
  const file = await readFile(join(process.cwd(), "corpus/index/chunks.jsonl"), "utf8");
  cachedChunks = file
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as CorpusChunk);
  return cachedChunks;
}

function tokenize(value: string) {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
}

function moduleKey(module: RelevanceModule) {
  return module.replaceAll("_", " ");
}

export async function searchCorpus(options: SearchCorpusOptions) {
  const chunks = await loadCorpusChunks();
  const queryTokens = tokenize(options.query ?? "");
  const tagSet = new Set((options.tags ?? []).map((tag) => tag.toLowerCase()));
  const categorySet = new Set(options.sourceCategories ?? []);
  const moduleSet = new Set(options.relevanceModules ?? []);

  return chunks
    .map((chunk) => {
      const haystack = `${chunk.title} ${chunk.source_name} ${chunk.source_category} ${chunk.text} ${chunk.why_it_matters} ${chunk.topic_tags.join(" ")} ${chunk.relevance_modules.map(moduleKey).join(" ")}`.toLowerCase();
      let score = 0;
      let queryScore = 0;

      for (const token of queryTokens) {
        if (haystack.includes(token)) queryScore += 2;
      }
      score += queryScore;

      for (const tag of tagSet) {
        if (chunk.topic_tags.some((item) => item.toLowerCase().includes(tag))) score += 3;
      }

      for (const category of categorySet) {
        if (chunk.source_category === category) score += 3;
      }

      for (const module of moduleSet) {
        if (chunk.relevance_modules.includes(module)) score += 4;
      }

      if (chunk.relevance_modules.includes("benchmark_precedent")) score += 1;

      return { chunk, score, queryScore };
    })
    .filter(({ score, queryScore }) => {
      if (!options.query && !tagSet.size && !categorySet.size && !moduleSet.size) return true;
      if (queryTokens.length > 0 && queryScore === 0) return false;
      return score > 0;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit ?? 8)
    .map(({ chunk }) => chunk);
}

const deploymentLayers: Array<{ id: RelevanceModule; layer: string; defaultStatus?: CoverageStatus; note: string }> = [
  { id: "licensing_path", layer: "Licensing / NRC", note: "Look for a current public NRC path, docket, review schedule, or pre-application record." },
  { id: "fuel_supply_haleu", layer: "Fuel supply / HALEU", note: "Look for assay, form, quantity, delivery windows, allocation, and supplier evidence." },
  { id: "fuel_fabrication", layer: "Fuel fabrication", note: "Look for a qualified fabrication route, licensed facility path, and interface evidence." },
  { id: "transportation_safeguards_storage", layer: "Transportation / safeguards", note: "Look for package, criticality, material control, safeguards, and storage evidence." },
  { id: "site_permitting", layer: "Site / permitting", defaultStatus: "missing", note: "Current corpus has little site-control, local permitting, or state-level evidence." },
  { id: "interconnection_power_delivery", layer: "Interconnection / power delivery", defaultStatus: "missing", note: "Current corpus has no FERC, ISO/RTO, interconnection, or delivery evidence for the claim." },
  { id: "bridge_power_phased_energization", layer: "Bridge power / phased energization", defaultStatus: "missing", note: "Current corpus has no bridge-power, temporary generation, or phased energization evidence for the claim." },
  { id: "epc_construction", layer: "EPC / construction", defaultStatus: "private diligence required", note: "Public sources rarely prove EPC scope, wrap, bid quality, contingencies, or construction responsibility." },
  { id: "commercial_offtake", layer: "Offtake / customer", defaultStatus: "private diligence required", note: "Binding offtake, customer credit, pricing, and termination terms usually require permissioned diligence." },
  { id: "financing", layer: "Financing", defaultStatus: "private diligence required", note: "Financing capacity, DOE LPO posture, equity support, and downside terms are not proven by reactor licensing sources." },
  { id: "operations_waste", layer: "Operations / waste", defaultStatus: "missing", note: "Operations, staffing, spent fuel, and waste assumptions need their own evidence beyond licensing headlines." },
];

export function buildSourceCoverage(chunks: CorpusChunk[]): SourceCoverage {
  const count = (module: RelevanceModule) => chunks.filter((chunk) => chunk.relevance_modules.includes(module)).length;
  const status = (module: RelevanceModule, defaultStatus?: CoverageStatus): CoverageStatus => {
    const hits = count(module);
    if (hits >= 3) return "covered";
    if (hits > 0) return "partial";
    return defaultStatus ?? "missing";
  };

  return deploymentLayers.map((layer): DeploymentLayerCoverageItem => ({
    id: layer.id,
    layer: layer.layer,
    status: status(layer.id, layer.defaultStatus),
    note: layer.note,
  }));
}

export function publicEvidenceNotes(chunks: CorpusChunk[]) {
  return chunks.slice(0, 6).map((chunk) => ({
    id: chunk.id,
    title: chunk.title,
    sourceName: chunk.source_name,
    sourceUrl: chunk.source_url,
    agency: chunk.agency,
    sourceCategory: chunk.source_category,
    relevance: chunk.why_it_matters,
  }));
}
