import companyProfiles from "../../../data/company_profiles.sample.json";
import { matchSources } from "@/lib/sources/matchSources";
import { rankDocumentsForClaim } from "@/lib/documents/rankDocumentsForClaim";
import type { SourceMatchResult } from "@/lib/sources/sourceTypes";
import type {
  AnalysisInput,
  AtomicClaim,
  AtomicClaimEvidenceStatus,
  EvidenceLedger,
  MatchedChunk,
  ClaimToIcMemo,
  CompanyProfile,
  CoverageStatus,
  DealVerdict,
  DeploymentLayerFinding,
  DetectedClaim,
  MemoResult,
  ProjectCounterpartyProfile,
  PublicEvidenceNote,
  MemoRelevantDocument,
} from "@/types/core";

export type ClaimType =
  | "data_center_power_claim"
  | "behind_the_meter_claim"
  | "fuel_cycle_claim"
  | "HALEU_claim"
  | "licensing_claim"
  | "NRC_engagement_claim"
  | "deployment_timeline_claim"
  | "offtake_claim"
  | "site_control_claim"
  | "financing_claim"
  | "EPC_construction_claim"
  | "bridge_power_claim"
  | "nuclear_integration_claim";

const profiles = companyProfiles as CompanyProfile[];

const claimKeywords: Record<ClaimType, string[]> = {
  data_center_power_claim: ["data center", "compute", "ai campus", "hyperscaler", "large load", "power campus", "colocation", "co-location"],
  behind_the_meter_claim: ["behind the meter", "behind-the-meter", "islanded", "private grid", "off-grid", "colocated", "co-located", "colocation", "co-location"],
  fuel_cycle_claim: ["fuel cycle", "fuel-cycle", "fabrication", "conversion", "deconversion", "supply chain", "first core", "reload", "reloads", "fuel", "fuel demand"],
  HALEU_claim: ["haleu", "high-assay", "high assay", "enrichment", "assay", "first core", "reload", "reloads"],
  licensing_claim: ["construction permit", "cola", "license", "licensing", "regulatory approval", "design certification", "certification", "docket", "docketed"],
  NRC_engagement_claim: ["nrc", "pre-application", "regulatory engagement", "readiness assessment", "application review"],
  deployment_timeline_claim: ["2030", "2031", "2032", "deploy", "deployment", "cod", "first power", "commercial operation"],
  offtake_claim: ["offtake", "customer", "ppa", "power purchase", "procurement", "power procurement", "hyperscaler", "anchor tenant", "long-term contract", "customer interest", "ppas", "signed ppas", "supplying", "supplied", "aws", "aws linked"],
  site_control_claim: ["site", "land", "controlled", "control", "permit", "permitting", "campus", "location"],
  financing_claim: ["financing", "financeable", "project finance", "lpo", "loan", "debt", "equity", "funding", "funded", "doe backed", "doe-backed", "award", "awards", "grant", "grants", "capex"],
  EPC_construction_claim: ["epc", "construction", "contractor", "build", "modular", "supply chain", "cost overrun", "factory", "factory built", "factory-built", "shipyard"],
  bridge_power_claim: ["bridge power", "fuel cell", "gas", "turbine", "phase 1", "initial energization", "temporary power"],
  nuclear_integration_claim: ["nuclear", "reactor", "reactors", "smr", "advanced reactor", "advanced reactors", "baseload", "small modular", "microreactor", "microreactors"]
};

const claimLabels: Record<ClaimType, string> = {
  data_center_power_claim: "data center power claim",
  behind_the_meter_claim: "behind-the-meter / islanded power claim",
  fuel_cycle_claim: "fuel-cycle claim",
  HALEU_claim: "HALEU claim",
  licensing_claim: "licensing claim",
  NRC_engagement_claim: "NRC engagement claim",
  deployment_timeline_claim: "deployment timeline claim",
  offtake_claim: "offtake/customer claim",
  site_control_claim: "site-control/permitting claim",
  financing_claim: "financing claim",
  EPC_construction_claim: "EPC/construction claim",
  bridge_power_claim: "bridge-power/phased energization claim",
  nuclear_integration_claim: "nuclear integration claim",
};

const layerMap: Record<ClaimType, string[]> = {
  data_center_power_claim: ["Interconnection / power delivery", "Offtake / customer", "Site / permitting"],
  behind_the_meter_claim: ["Interconnection / power delivery", "Site / permitting", "Operations / waste"],
  fuel_cycle_claim: ["Fuel supply / HALEU", "Fuel fabrication", "Transportation / safeguards"],
  HALEU_claim: ["Fuel supply / HALEU", "Fuel fabrication", "Transportation / safeguards"],
  licensing_claim: ["Licensing / NRC"],
  NRC_engagement_claim: ["Licensing / NRC"],
  deployment_timeline_claim: ["Licensing / NRC", "Site / permitting", "EPC / construction", "Fuel supply / HALEU", "Financing"],
  offtake_claim: ["Offtake / customer", "Financing"],
  site_control_claim: ["Site / permitting", "Interconnection / power delivery"],
  financing_claim: ["Financing", "Offtake / customer"],
  EPC_construction_claim: ["EPC / construction", "Site / permitting"],
  bridge_power_claim: ["Bridge power / phased energization", "Interconnection / power delivery", "Financing"],
  nuclear_integration_claim: ["Licensing / NRC", "Fuel supply / HALEU", "EPC / construction", "Operations / waste"],
};

const allLayers = [
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
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesPhrase(haystack: string, phrase: string) {
  const normalizedPhrase = normalize(phrase);
  if (!normalizedPhrase) return false;
  return new RegExp(`(^| )${escapeRegExp(normalizedPhrase)}($| )`).test(haystack);
}
function matchCompany(target: string, note: string): CompanyProfile | undefined {
  const haystack = normalize(`${target} ${note}`);
  return profiles.find((profile) => profile.aliases.some((alias) => includesPhrase(haystack, alias)) || includesPhrase(haystack, profile.name));
}

function detectClaims(note: string, profile?: CompanyProfile): DetectedClaim[] {
  const haystack = normalize(note);
  const detected = Object.entries(claimKeywords)
    .map(([claimType, keywords]) => {
      const triggeredKeywords = keywords.filter((keyword) => includesPhrase(haystack, keyword));
      return { claimType: claimType as ClaimType, triggeredKeywords };
    })
    .filter((item) => {
      if (!item.triggeredKeywords.length) return false;
      if (item.claimType !== "data_center_power_claim") return true;
      return ["data center", "compute", "ai campus", "hyperscaler", "large load", "power campus", "behind the meter", "behind-the-meter", "colocation", "co-location"].some((keyword) => includesPhrase(haystack, keyword));
    })
    .map((item) => ({
      claimType: item.claimType,
      label: claimLabels[item.claimType],
      triggeredKeywords: item.triggeredKeywords,
      deploymentLayers: layerMap[item.claimType],
    }));

  const detectedTypes = new Set(detected.map((claim) => claim.claimType));
  if (detectedTypes.has("HALEU_claim") && !detectedTypes.has("fuel_cycle_claim")) {
    detected.push({
      claimType: "fuel_cycle_claim",
      label: claimLabels.fuel_cycle_claim,
      triggeredKeywords: ["HALEU fuel path"],
      deploymentLayers: layerMap.fuel_cycle_claim,
    });
  }

  if (detected.length > 0 || !profile) return detected;

  return profile.likely_claim_types.slice(0, 4).map((claimType) => ({
    claimType,
    label: claimLabels[claimType as ClaimType] ?? claimType.replaceAll("_", " "),
    triggeredKeywords: ["company profile default"],
    deploymentLayers: layerMap[claimType as ClaimType] ?? [],
  }));
}

function statusForLayer(layer: string, detectedClaimTypes: Set<string>, profile?: CompanyProfile): DeploymentLayerFinding["status"] {
  if (layer === "Offtake / customer" || layer === "Financing" || layer === "EPC / construction") return "private diligence required";
  if (layer === "Licensing / NRC") {
    if (detectedClaimTypes.has("licensing_claim") || detectedClaimTypes.has("NRC_engagement_claim")) return "plausible";
    if (profile?.category === "data_center_power_infrastructure" && detectedClaimTypes.has("nuclear_integration_claim")) return "unsupported";
  }
  if (layer === "Fuel supply / HALEU" || layer === "Fuel fabrication" || layer === "Transportation / safeguards") {
    if (detectedClaimTypes.has("HALEU_claim") || detectedClaimTypes.has("fuel_cycle_claim")) return "unsupported";
    if (detectedClaimTypes.has("nuclear_integration_claim")) return "unsupported";
  }
  if (layer === "Bridge power / phased energization") return detectedClaimTypes.has("bridge_power_claim") ? "unsupported" : "unsupported";
  if (layer === "Site / permitting" || layer === "Interconnection / power delivery") return "unsupported";
  if (layer === "Operations / waste") return "cannot know from public docs";
  return "unsupported";
}

function requiredEvidenceForLayer(layer: string, target: string, profile?: CompanyProfile) {
  const common: Record<string, string> = {
    "Licensing / NRC": "Named license applicant, reactor vendor, licensing path, public NRC docket or pre-application record, and responsibility for regulatory risk.",
    "Fuel supply / HALEU": "Assay, form, quantity, delivery window, supplier allocation/reservation, and fallback case if fuel slips.",
    "Fuel fabrication": "Named fabrication route, licensed facility status, qualification plan, interface owner, and capacity reservation.",
    "Transportation / safeguards": "Package/criticality basis, safeguards category, storage plan, logistics owner, and responsible licensee mapping.",
    "Site / permitting": "Site-control documents, land rights, permit matrix, local approvals, environmental constraints, and schedule-critical conditions.",
    "Interconnection / power delivery": "Interconnection queue position or islanded operating basis, power-delivery design, substation/transmission scope, and energization milestones.",
    "Bridge power / phased energization": "Initial power source, term, cost, emissions exposure, permits, reliability obligations, and transition plan to permanent supply.",
    "EPC / construction": "EPC scope, contractor identity, cost basis, schedule, contingency, performance security, and who owns overruns.",
    "Offtake / customer": "Binding customer/offtake agreement, credit support, pricing framework, termination rights, and load ramp schedule.",
    "Financing": "Sources and uses, committed equity/debt, DOE LPO or grant status if claimed, milestone conditions, and downside case.",
    "Operations / waste": "Operator model, staffing, maintenance, security, spent fuel handling, waste plan, and long-term responsibility." ,
  };

  if (profile?.category === "data_center_power_infrastructure" && layer === "Licensing / NRC") {
    return `For ${target}, identify whether nuclear licensing sits with Shuffle, a reactor vendor, a project company, or another owner, then provide the public path and gating milestones.`;
  }

  return common[layer] ?? "Layer-specific third-party evidence and accountable owner.";
}

function findingForLayer(layer: string, target: string, detectedClaimTypes: Set<string>, profile?: CompanyProfile) {
  if (profile?.category === "data_center_power_infrastructure") {
    const findings: Record<string, string> = {
      "Licensing / NRC": `${target} should not be treated as a reactor developer unless it owns the reactor technology or license application. Nuclear is a long-term integration dependency until the vendor, applicant, and NRC path are named.`,
      "Fuel supply / HALEU": `If ${target} relies on advanced reactors, HALEU is an indirect but material dependency. It is not evidenced by a data-center power-campus claim alone.`,
      "Fuel fabrication": `Fabrication readiness belongs to the reactor/fuel vendor path, not the campus developer narrative, and needs named supplier evidence.`,
      "Transportation / safeguards": `Transport, safeguards, storage, and material-control requirements need a responsible licensee and fuel path before the nuclear case is bankable.`,
      "Site / permitting": `${target}'s power-campus claim turns first on site control, local permitting, and whether the site can host the claimed power configuration.`,
      "Interconnection / power delivery": `Behind-the-meter or islanded delivery assumptions need a real electrical architecture, grid-interface plan, and energization evidence.`,
      "Bridge power / phased energization": `Bridge power determines whether the data center can energize before nuclear is available and whether economics survive a delayed nuclear transition.`,
      "EPC / construction": `The claim needs construction responsibility across data center, power island, bridge generation, and eventual nuclear integration.`,
      "Offtake / customer": `The campus is only financeable if the load/customer commitment is binding or otherwise creditworthy.`,
      "Financing": `Financing depends on contracted load, credible initial power, site rights, and whether nuclear is base case or upside optionality.`,
      "Operations / waste": `Operations and waste are long-term nuclear integration items that cannot be inferred from a power-campus claim.`,
    };
    return findings[layer] ?? `${layer} requires evidence specific to ${target}.`;
  }

  if (layer === "Licensing / NRC") return `${target}'s deployment claim needs public evidence of the actual licensing path, not only management assertions.`;
  if (layer.includes("Fuel")) return `${target}'s fuel claim needs assay, supplier, fabrication, qualification, and delivery evidence.`;
  if (layer === "Offtake / customer") return `${target}'s customer/offtake claim is not bankable without binding terms or creditworthy commitments.`;
  if (layer === "EPC / construction") return `${target}'s schedule depends on credible construction responsibility, cost basis, and contractor readiness.`;
  return `${target}'s claim implicates ${layer.toLowerCase()} and needs layer-specific proof.`;
}

function buildLayerFindings(target: string, detectedClaims: DetectedClaim[], profile?: CompanyProfile): DeploymentLayerFinding[] {
  const claimTypes = new Set(detectedClaims.map((claim) => claim.claimType));
  const implicated = new Set(detectedClaims.flatMap((claim) => claim.deploymentLayers));

  if (profile?.category === "data_center_power_infrastructure") {
    ["Site / permitting", "Interconnection / power delivery", "Bridge power / phased energization", "Offtake / customer", "EPC / construction", "Financing"].forEach((layer) => implicated.add(layer));
    if (claimTypes.has("nuclear_integration_claim") || claimTypes.has("HALEU_claim")) {
      ["Licensing / NRC", "Fuel supply / HALEU", "Fuel fabrication", "Transportation / safeguards", "Operations / waste"].forEach((layer) => implicated.add(layer));
    }
  }

  return allLayers
    .filter((layer) => implicated.has(layer))
    .map((layer) => ({
      layer,
      status: statusForLayer(layer, claimTypes, profile),
      finding: findingForLayer(layer, target, claimTypes, profile),
      whyItMatters: `${layer} can independently break the timeline, economics, or bankability of the claim.`,
      requiredEvidence: requiredEvidenceForLayer(layer, target, profile),
    }));
}

function coverageStatus(status: DeploymentLayerFinding["status"]): CoverageStatus {
  if (status === "evidenced") return "covered";
  if (status === "plausible") return "partial";
  if (status === "private diligence required") return "private diligence required";
  if (status === "cannot know from public docs") return "cannot know from public docs";
  return "missing";
}

function verdictFor(profile: CompanyProfile | undefined, detectedClaims: DetectedClaim[]): DealVerdict {
  const claimTypes = new Set(detectedClaims.map((claim) => claim.claimType));
  if (profile?.category === "data_center_power_infrastructure" && claimTypes.has("nuclear_integration_claim")) return "Diligence Required";
  if (claimTypes.has("data_center_power_claim") && (claimTypes.has("nuclear_integration_claim") || claimTypes.has("offtake_claim"))) return "Diligence Required";
  if (claimTypes.has("deployment_timeline_claim") || claimTypes.has("HALEU_claim")) return "Diligence Required";
  return "Monitor";
}

function buildQuestions(target: string, profile: CompanyProfile | undefined, findings: DeploymentLayerFinding[], detectedClaims: DetectedClaim[]) {
  const base = profile?.default_diligence_questions ?? [];
  const claimTypes = new Set(detectedClaims.map((claim) => claim.claimType));
  const layerQuestionMap: Record<string, string[]> = {
    "Licensing / NRC": ["Who is the named NRC applicant, and what public docket or pre-application record supports the claimed path?"],
    "Fuel supply / HALEU": ["What HALEU assay, form, quantity, supplier, allocation, and delivery window support first core and reload claims?"],
    "Fuel fabrication": ["Which licensed fabrication facility will make the fuel, and what qualification or capacity evidence supports that route?"],
    "Transportation / safeguards": ["Who owns transportation, safeguards, criticality, and storage responsibility, and what public or counterparty evidence supports the plan?"],
    "Site / permitting": ["Which named sites are controlled, and what land rights, permits, and local approvals have been secured?"],
    "Interconnection / power delivery": ["What is the power-delivery basis: grid interconnection, behind-the-meter service, islanded operation, or another structure?"],
    "Bridge power / phased energization": ["What power source supports initial energization, on what term, at what cost, and what happens if nuclear slips?"],
    "EPC / construction": ["Who is responsible for EPC execution, and what contract scope, cost basis, schedule, and risk allocation are binding?"],
    "Offtake / customer": ["Is the customer/offtake agreement binding or preliminary, and what credit support or termination rights apply?"],
    Financing: ["What capital is committed, what remains conditional, and what milestones would unlock project finance or DOE LPO support?"],
    "Operations / waste": ["Who will operate the nuclear asset and own spent fuel, security, waste, and long-term operational responsibility?"],
  };
  const layerQuestions = findings.flatMap((finding) => layerQuestionMap[finding.layer] ?? [`What evidence resolves the ${finding.layer.toLowerCase()} dependency?`]);
  const claimQuestions = [
    claimTypes.has("deployment_timeline_claim") ? "Which dated milestones connect the current status to the claimed commercial operation date?" : "",
    claimTypes.has("NRC_engagement_claim") ? "Is NRC engagement limited to pre-application discussion, or has an application been accepted, docketed, or reviewed?" : "",
    claimTypes.has("HALEU_claim") ? "Does the fuel evidence cover first core only, or both first core and reloads?" : "",
    claimTypes.has("data_center_power_claim") ? "Which customer load is binding, and what MW ramp is actually committed?" : "",
  ].filter(Boolean);
  return Array.from(new Set([...base, ...layerQuestions, ...claimQuestions])).slice(0, 10);
}
function toPublicEvidenceNote(note: SourceMatchResult["relevantSourceNotes"][number]): PublicEvidenceNote {
  return {
    id: note.id,
    title: note.title,
    sourceName: note.title,
    sourceUrl: note.source_url,
    agency: note.organization,
    organization: note.organization,
    sourceCategory: note.source_type,
    sourceType: note.source_type,
    relevance: note.why_it_matters,
    whyItMatters: note.why_it_matters,
    whatItEstablishes: note.what_it_establishes,
    whatItDoesNotEstablish: note.what_it_does_not_establish,
    evidenceStrength: note.evidence_strength,
    dateOrStatus: note.date_or_status,
  };
}

function toMemoRelevantDocument(document: ReturnType<typeof rankDocumentsForClaim>["relevantDocuments"][number]): MemoRelevantDocument {
  return {
    rank: document.rank,
    title: document.title,
    url: document.url,
    adamsAccession: document.adams_accession || undefined,
    documentFamily: document.document_family,
    deploymentLayers: document.deployment_layers,
    whyItMatters: document.why_it_matters,
    memoSectionsSupported: document.memo_sections_supported,
    benchmarkValue: document.benchmark_value,
    suggestedChunkingStrategy: document.suggested_chunking_strategy,
    validationStatus: document.url_status ?? "unchecked",
    httpStatus: document.http_status ?? null,
    contentType: document.content_type ?? "",
    validationError: document.validation_error ?? "",
  };
}


function humanStatus(status: AtomicClaimEvidenceStatus) {
  return status.replaceAll("_", " ");
}

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function claimTextFor(target: string, claimType: string, note: string, triggeredBy: string[]) {
  const year = note.match(/\b20(2[6-9]|3[0-9])\b/)?.[0];
  const mw = note.match(/\b\d{2,4}\s?mw\b/i)?.[0]?.replace(/\s+/g, " ");
  const base: Record<string, string[]> = {
    data_center_power_claim: [
      `${target} claims${mw ? ` ${mw}` : ""} data center or large-load campus development.`,
    ],
    behind_the_meter_claim: [`${target} claims behind-the-meter, islanded, or campus-scale power delivery.`],
    bridge_power_claim: [`${target} claims near-term bridge power or phased energization before permanent supply is available.`],
    nuclear_integration_claim: [
      `${target} claims future nuclear baseload or advanced-reactor integration.`,
      `${target} implies a transition from bridge or initial power to permanent nuclear power.`,
    ],
    HALEU_claim: [
      `${target} claims secured HALEU supply.`,
      triggeredBy.some((item) => item.includes("first core")) ? `${target} claims first-core fuel availability.` : "",
      triggeredBy.some((item) => item.includes("reload")) ? `${target} claims reload fuel availability.` : "",
    ],
    fuel_cycle_claim: [`${target} implies a fuel fabrication, qualification, transportation, and safeguards path.`],
    deployment_timeline_claim: [`${target} claims deployment${year ? ` by ${year}` : " on the stated timeline"}.`],
    NRC_engagement_claim: [`${target} claims NRC engagement or pre-application activity.`],
    licensing_claim: [`${target} claims a licensing path sufficient for the stated deployment schedule.`],
    offtake_claim: [`${target} claims customer, offtake, PPA, or load commitment relevance.`],
    site_control_claim: [`${target} claims site control, site availability, or project-site readiness.`],
    financing_claim: [`${target} claims financing, funding, DOE LPO, or capital availability.`],
    EPC_construction_claim: [`${target} claims EPC, construction, modular build, or contractor execution readiness.`],
  };
  return (base[claimType] ?? [`${target} makes a ${claimLabels[claimType as ClaimType] ?? claimType.replaceAll("_", " ")} that requires evidence.`]).filter(Boolean);
}

function classifyAtomicClaim(claimType: string, layers: string[], matchedChunks: MatchedChunk[]): AtomicClaimEvidenceStatus {
  if (claimType === "behind_the_meter_claim" || claimType === "site_control_claim") return "user_note_only";
  if (claimType === "bridge_power_claim" || claimType === "offtake_claim" || claimType === "financing_claim" || claimType === "EPC_construction_claim" || claimType === "nuclear_integration_claim" || claimType === "deployment_timeline_claim") return "private_diligence_required";
  if (layers.some((layer) => layer === "Operations / waste")) return "cannot_know_from_public_docs";
  if (layers.some((layer) => layer === "Offtake / customer" || layer === "Financing" || layer === "EPC / construction")) return "private_diligence_required";
  if (matchedChunks.length) return "partially_supported_by_public_source";
  return "user_note_only";
}

function doesNotProveFor(claimText: string) {
  return `This context does not prove that ${claimText.replace(/\.$/, "").toLowerCase()} is true for the target, nor does it establish private contracts, permits, financing, or execution responsibility.`;
}

function chunkToMatchedChunk(chunk: ReturnType<typeof rankDocumentsForClaim>["chunkEvidence"][number], claim: DetectedClaim): MatchedChunk {
  const matchedLayer = chunk.matched_layers.find((layer) => claim.deploymentLayers.includes(layer)) ?? claim.deploymentLayers[0] ?? chunk.deployment_layers[0] ?? "Deployment layer";
  return {
    chunkId: chunk.chunk_id,
    documentId: chunk.document_id,
    documentTitle: chunk.title,
    rank: chunk.rank,
    deploymentLayers: chunk.deployment_layers,
    excerpt: chunk.excerpt,
    relevanceReason: `Relevant to ${matchedLayer} and the ${claim.label}; useful as public context or precedent, not target-specific proof.`,
    doesNotProve: `Does not prove the target has secured project-specific ${matchedLayer.toLowerCase()} evidence or private commitments.`,
  };
}

function preferredChunkTerms(claimType: string) {
  const preferred: Record<string, string[]> = {
    data_center_power_claim: ["ferc", "talen", "constellation", "large load", "co location", "colocation", "pjm", "amazon", "microsoft", "susquehanna", "crane"],
    behind_the_meter_claim: ["ferc", "talen", "constellation", "co location", "colocation", "interconnection", "pjm", "susquehanna"],
    bridge_power_claim: ["large load", "power delivery", "interconnection", "financing", "pjm", "ferc"],
    offtake_claim: ["talen", "constellation", "amazon", "microsoft", "ppa", "customer"],
    HALEU_claim: ["haleu", "centrus", "triso", "criticality", "transportation", "allocation", "enrichment"],
    fuel_cycle_claim: ["haleu", "centrus", "triso", "criticality", "transportation", "fabrication", "new fuels"],
    NRC_engagement_claim: ["lic 116", "preapplication", "pre application", "readiness", "nuscale", "rai", "regulatory guide", "arcap", "kemmerer", "long mott"],
    licensing_claim: ["lic 116", "preapplication", "readiness", "nuscale", "rai", "regulatory guide", "arcap", "kemmerer", "long mott"],
    deployment_timeline_claim: ["lic 116", "readiness", "nuscale", "rai", "arcap", "kemmerer", "long mott", "review schedule", "construction permit"],
  };
  return preferred[claimType] ?? [];
}

function claimChunkScore(chunk: ReturnType<typeof rankDocumentsForClaim>["chunkEvidence"][number], claim: DetectedClaim) {
  const haystack = normalize([chunk.title, chunk.document_family, chunk.excerpt, ...chunk.memo_sections_supported, ...chunk.deployment_layers].join(" "));
  const preferredScore = preferredChunkTerms(claim.claimType).filter((term) => haystack.includes(normalize(term))).length * 50;
  const layerScore = chunk.matched_layers.filter((layer) => claim.deploymentLayers.includes(layer)).length * 10;
  const claimScore = chunk.matched_claim_types.includes(claim.claimType) ? 20 : 0;
  return preferredScore + layerScore + claimScore + Math.max(0, 151 - chunk.rank) / 10;
}

function buildEvidenceLedger(
  target: string,
  note: string,
  detectedClaims: DetectedClaim[],
  findings: DeploymentLayerFinding[],
  documentMatch: ReturnType<typeof rankDocumentsForClaim>,
  documentCoverage: MemoResult["documentCoverage"],
  relevantDocuments: MemoRelevantDocument[],
): EvidenceLedger {
  const atomicClaims: AtomicClaim[] = [];

  detectedClaims.forEach((claim) => {
    const texts = claimTextFor(target, claim.claimType, note, claim.triggeredKeywords);
    texts.forEach((text) => {
      const matchedChunks = documentMatch.chunkEvidence
        .filter((chunk) => chunk.matched_claim_types.includes(claim.claimType) || chunk.matched_layers.some((layer) => claim.deploymentLayers.includes(layer)))
        .sort((a, b) => claimChunkScore(b, claim) - claimChunkScore(a, claim) || a.rank - b.rank || a.chunk_index - b.chunk_index)
        .slice(0, 3)
        .map((chunk) => chunkToMatchedChunk(chunk, claim));
      const matchedManifestDocs = relevantDocuments
        .filter((document) => document.deploymentLayers.some((layer) => claim.deploymentLayers.includes(layer)))
        .slice(0, 3);
      const evidenceStatus = classifyAtomicClaim(claim.claimType, claim.deploymentLayers, matchedChunks);
      atomicClaims.push({
        id: `atomic-${atomicClaims.length + 1}`,
        text,
        claimType: claim.claimType,
        deploymentLayers: claim.deploymentLayers,
        triggeredBy: claim.triggeredKeywords,
        targetSpecificity: "target_specific",
        evidenceStatus,
        confidence: evidenceStatus === "private_diligence_required" || evidenceStatus === "cannot_know_from_public_docs" ? "high" : matchedChunks.length ? "medium" : "low",
        requiredEvidence: claim.deploymentLayers.map((layer) => requiredEvidenceForLayer(layer, target)).join(" "),
        whyItMatters: claim.deploymentLayers.map((layer) => `${layer} can break bankability, schedule, or execution if unsupported.`).join(" "),
        matchedChunks,
        matchedManifestDocs,
        whatThisDoesNotProve: doesNotProveFor(text),
      });
    });
  });

  if (!atomicClaims.length) {
    atomicClaims.push({
      id: "atomic-1",
      text: `${target} provided a claim that could not be decomposed into a supported nuclear deployment claim type by deterministic rules.`,
      claimType: "unclear",
      deploymentLayers: [],
      triggeredBy: [],
      targetSpecificity: "unclear",
      evidenceStatus: "missing",
      confidence: "low",
      requiredEvidence: "A clearer claim and layer-specific public or counterparty evidence package.",
      whyItMatters: "Unclear claims cannot support an IC memo without decomposition into testable assertions.",
      matchedChunks: [],
      matchedManifestDocs: [],
      whatThisDoesNotProve: "No target-specific deployment claim has been proven.",
    });
  }

  const topMissingEvidence = Array.from(new Set(atomicClaims
    .filter((claim) => claim.evidenceStatus === "missing" || claim.evidenceStatus === "user_note_only" || claim.evidenceStatus === "partially_supported_by_public_source")
    .map((claim) => claim.requiredEvidence)
  )).slice(0, 5);

  const privateDiligenceRequired = Array.from(new Set(atomicClaims
    .filter((claim) => claim.evidenceStatus === "private_diligence_required" || claim.evidenceStatus === "cannot_know_from_public_docs")
    .map((claim) => `${claim.text} Required: ${claim.requiredEvidence}`)
  )).slice(0, 6);

  const whatWouldChangeVerdict = Array.from(new Set([
    ...topMissingEvidence,
    ...privateDiligenceRequired,
    "Named NRC applicant and public docket or pre-application record.",
    "Site-control documents for named project sites.",
    "Binding customer/offtake agreement or credit support.",
    "Named reactor vendor and licensing owner.",
    "HALEU assay, form, quantity, supplier, allocation, fabrication, and transport evidence.",
    "EPC scope, contractor, cost basis, schedule, and risk allocation.",
    "Financing sources, uses, milestone conditions, and downside case.",
  ])).slice(0, 8);

  return {
    atomicClaims,
    deploymentLayerSummary: documentCoverage ?? [],
    topMissingEvidence,
    privateDiligenceRequired,
    whatWouldChangeVerdict,
  };
}

function ledgerChunkEvidence(ledger: EvidenceLedger) {
  const seen = new Set<string>();
  return ledger.atomicClaims.flatMap((claim) => claim.matchedChunks).filter((chunk) => {
    if (seen.has(chunk.chunkId)) return false;
    seen.add(chunk.chunkId);
    return true;
  }).slice(0, 6);
}

function buildWhatWouldChangeVerdict(ledger: EvidenceLedger) {
  return ledger.whatWouldChangeVerdict.length ? ledger.whatWouldChangeVerdict : [
    "Named accountable owner for each deployment layer.",
    "Public source or counterparty-provided evidence that resolves the highest-risk claims.",
  ];
}

function buildMemo(input: AnalysisInput, profile: CompanyProfile | undefined, detectedClaims: DetectedClaim[], findings: DeploymentLayerFinding[], sourceMatch: SourceMatchResult): MemoResult {
  const target = input.targetCompanyProject.trim() || profile?.name || "the target counterparty";
  const category = profile?.category ?? "unrecognized_counterparty";
  const verdict = verdictFor(profile, detectedClaims);
  const confidence = sourceMatch.confidence;
  const questions = buildQuestions(target, profile, findings, detectedClaims);
  const claimLabelsList = detectedClaims.map((claim) => claim.label);
  const topFindings = findings.slice(0, 6);

  const documentMatch = rankDocumentsForClaim({ detectedClaims, deploymentLayerFindings: findings, targetText: `${target} ${input.note}`, limit: 8 });
  const relevantDocuments = documentMatch.relevantDocuments.map(toMemoRelevantDocument);
  const documentCoverage = documentMatch.documentCoverage.map((item) => ({
    layer: item.layer,
    corpusCoverage: item.corpusCoverage,
    targetSpecificSupport: item.targetSpecificSupport,
    conclusion: item.conclusion,
    matchedCount: item.matchedCount,
    topDocuments: item.topDocuments.map(toMemoRelevantDocument),
  }));
  const evidenceLedger = buildEvidenceLedger(target, input.note, detectedClaims, findings, documentMatch, documentCoverage, relevantDocuments);
  const uniqueLedgerChunks = ledgerChunkEvidence(evidenceLedger);
  const isShuffleLike = category === "data_center_power_infrastructure";
  const oneLineJudgment = isShuffleLike
    ? `${target} appears to be a data-center power infrastructure diligence case, not a reactor developer case. Treat nuclear as long-term optionality unless site control, initial power, customer/offtake, reactor vendor, licensing responsibility, EPC, and fuel-cycle evidence are provided.`
    : `${target} requires input-specific diligence across ${topFindings.map((item) => item.layer).join(", ") || "the relevant deployment layers"}; current deterministic analysis does not support treating the claim as bankable without proof.`;

  const recommendedNextAction = isShuffleLike
    ? `For ${target}, diligence the power-campus stack first: site rights, initial energization source, customer/offtake, bridge-power economics, and whether nuclear is base case or upside. Then require the named reactor vendor and licensing owner.`
    : `Ask ${target} for layer-specific evidence for the detected claims before treating the deployment timeline or commercial claim as bankable.`;

  const whatIsEvidenced = uniqueLedgerChunks.length
    ? uniqueLedgerChunks.slice(0, 3).map((chunk) => `${chunk.documentTitle}: ${chunk.relevanceReason}`)
    : ["No chunk-backed public evidence currently proves the target-specific claims. Treat the input as a claim set until evidence is provided."];

  const whatIsNotYetEvidenced = evidenceLedger.topMissingEvidence.length
    ? evidenceLedger.topMissingEvidence
    : (isShuffleLike
        ? [
            "Binding site-control package and permitting path for the claimed campus scale.",
            "Initial energization source, cost, reliability, and bridge-power duration.",
            "Binding customer/offtake agreement or creditworthy load commitment.",
            "Named reactor vendor, licensing applicant, fuel-cycle path, and construction owner for nuclear baseload.",
            "Plan for what happens if nuclear slips 5-10 years.",
          ]
        : topFindings.map((finding) => `${finding.layer}: ${finding.requiredEvidence}`));

  const majorKillRisks = isShuffleLike
    ? [
        "The data center campus cannot energize at the claimed MW scale on the claimed schedule.",
        "Customer/offtake is preliminary rather than binding and financeable.",
        "Nuclear is marketed as base-case power but is actually long-term optionality.",
        "No named reactor vendor, NRC licensing owner, fuel path, or EPC responsibility exists.",
        "Bridge-power economics fail if nuclear slips 5-10 years.",
      ]
    : topFindings.map((finding) => `${finding.layer}: ${finding.finding}`).slice(0, 5);

  const whatMustBeTrue = isShuffleLike
    ? [
        `${target} controls sites that can host the proposed load and power configuration.`,
        "Initial power can energize the campus before nuclear arrives, at financeable cost and reliability.",
        "Customer/offtake commitments are binding or otherwise creditworthy.",
        "Nuclear is clearly defined as base case or upside case, with a named reactor vendor and licensing owner.",
        "EPC, interconnection/islanded operation, and transition from bridge power to nuclear baseload are executable.",
      ]
    : topFindings.map((finding) => `${finding.layer} must be supported by: ${finding.requiredEvidence}`).slice(0, 6);

  const situation = isShuffleLike
    ? `${target} is being evaluated as a data-center power infrastructure counterparty. The entered claim points to behind-the-meter or campus-scale power delivery with possible long-term nuclear integration, so diligence should prioritize power-campus deliverability before reactor-design conclusions.`
    : `${target} is being evaluated for: ${input.decisionQuestion}. The entered claim triggers ${claimLabelsList.join(", ") || "no high-confidence claim type"}.`;

  const thesis = isShuffleLike
    ? `${target} may be interesting if it can prove site control, near-term power, binding load/customer demand, and a credible path from bridge power to nuclear baseload. Without named nuclear counterparties and licensing responsibility, the nuclear component should be treated as long-term optionality, not bankable supply.`
    : `${target} may merit further diligence, but the detected claims need evidence across each implicated deployment layer before the timeline, fuel-cycle, commercial, or construction claims can support an IC view.`;

  return {
    verdict,
    confidence,
    oneLineJudgment,
    recommendedNextAction,
    detectedClaims,
    deploymentLayerFindings: findings,
    firstPassIcMemo: {
      target,
      decision: input.decisionQuestion,
      userType: input.userType,
      verdict,
      confidence,
      situation,
      thesis,
      whatIsEvidenced,
      whatIsNotYetEvidenced,
      majorKillRisks,
      whatMustBeTrue: buildWhatWouldChangeVerdict(evidenceLedger),
      diligenceQuestions: questions,
      recommendedNextStep: recommendedNextAction,
      sourcesAndEvidenceNotes: [
        "Deterministic input-sensitive analysis only; no OpenAI calls were made.",
        sourceMatch.confidenceRationale,
        `Selected company category: ${category}.`,
        `Input claim excerpt: ${input.note.trim().slice(0, 260) || "No note provided."}`,
        ...(sourceMatch.relevantSourceNotes.length
          ? sourceMatch.relevantSourceNotes.slice(0, 6).map((note) => `${note.organization}: ${note.title} - ${note.why_it_matters}`)
          : ["No public source in the current corpus supports this claim. Treat as unsupported unless the counterparty provides evidence."]),
        ...(relevantDocuments.length
          ? relevantDocuments.slice(0, 6).map((document) => `Manifest #${document.rank}: ${document.title} - ${document.whyItMatters}`)
          : ["No ranked manifest document matched the detected deployment layers."]),
      ],
    },
    debug: {
      detectedCompanyProfile: profile?.name ?? null,
      companyCategory: category,
      detectedClaimTypes: detectedClaims.map((claim) => claim.claimType),
      triggeredKeywords: Object.fromEntries(detectedClaims.map((claim) => [claim.claimType, claim.triggeredKeywords])),
      deploymentLayersImplicated: findings.map((finding) => finding.layer),
      selectedMemoTemplate: isShuffleLike ? "data_center_power_infrastructure" : profile ? `company_category_${profile.category}` : "generic_claim_type_template",
    },
    confidenceRationale: sourceMatch.confidenceRationale,
    sourceCoverage: sourceMatch.sourceCoverageByLayer.map((item) => ({
      id: item.layer,
      layer: item.layer,
      status: item.status,
      note: item.note,
    })),
    relevantPublicEvidenceNotes: sourceMatch.relevantSourceNotes.map(toPublicEvidenceNote),
    relevantDocuments,
    manifestOnlyDocuments: documentMatch.manifestOnlyDocuments.map(toMemoRelevantDocument),
    documentCoverage,
    evidenceLedger,
    unsupportedLayers: sourceMatch.unsupportedLayers,
    privateDiligenceLayers: sourceMatch.privateDiligenceLayers,
  };
}

export function analyzeInput(input: AnalysisInput): MemoResult {
  const profile = matchCompany(input.targetCompanyProject, input.note);
  const detectedClaims = detectClaims(input.note, profile);
  const findings = buildLayerFindings(input.targetCompanyProject.trim() || profile?.name || "Target", detectedClaims, profile);
  const sourceMatch = matchSources({
    companyProfile: profile,
    detectedClaims,
    deploymentLayerFindings: findings,
    userType: input.userType,
    decisionQuestion: input.decisionQuestion,
  });
  return buildMemo(input, profile, detectedClaims, findings, sourceMatch);
}

export function applyMemoResult(profile: ProjectCounterpartyProfile, result: MemoResult): ProjectCounterpartyProfile {
  const updated = JSON.parse(JSON.stringify(profile)) as ProjectCounterpartyProfile;
  updated.companyName = result.firstPassIcMemo.target;
  updated.projectName = result.firstPassIcMemo.target;
  updated.claimToIcMemo = {
    ...updated.claimToIcMemo,
    verdict: result.verdict,
    confidence: result.confidence,
    confidenceRationale: result.confidenceRationale,
    oneLineJudgment: result.oneLineJudgment,
    recommendedNextAction: result.recommendedNextAction,
    detectedClaims: result.detectedClaims,
    deploymentLayerFindings: result.deploymentLayerFindings,
    analysisDebug: result.debug,
    sourceCoverage: result.sourceCoverage,
    publicEvidenceNotes: result.relevantPublicEvidenceNotes,
    relevantDocuments: result.relevantDocuments,
    documentCoverage: result.documentCoverage,
    evidenceLedger: result.evidenceLedger,
    unsupportedLayers: result.unsupportedLayers,
    privateDiligenceLayers: result.privateDiligenceLayers,
    firstPassIcMemo: result.firstPassIcMemo,
    whatMustBeTrue: result.firstPassIcMemo.whatMustBeTrue.map((statement, index) => ({
      id: `input-must-${index + 1}`,
      statement,
      status: index < 2 ? "unsupported" : "private diligence required",
      whyItMatters: "This condition is required for the input claim to become diligence-grade rather than narrative.",
      requiredEvidence: result.deploymentLayerFindings[index]?.requiredEvidence ?? "Counterparty-provided proof package and accountable owner.",
    })),
    timelineCredibility: {
      title: "Timeline credibility",
      assessment: result.deploymentLayerFindings.some((finding) => finding.layer.includes("Bridge") || finding.layer.includes("Interconnection"))
        ? "The timeline depends on power delivery, bridge power, site, customer, and nuclear integration evidence. Treat the date as unsupported until those layer proofs exist."
        : "The timeline should be treated as a management claim until public and private milestone evidence supports it.",
      evidenceTier: "inferred",
    },
    fuelCycleReadiness: {
      title: "Fuel-cycle readiness",
      assessment: result.deploymentLayerFindings.some((finding) => finding.layer.includes("Fuel"))
        ? "Fuel-cycle readiness is implicated but not evidenced without supplier, fabrication, transport, and delivery proof."
        : "Fuel-cycle readiness was not the central detected claim in this note.",
      evidenceTier: "inferred",
    },
    regulatoryMaturity: {
      title: "Regulatory / NRC status",
      assessment: result.deploymentLayerFindings.some((finding) => finding.layer.includes("Licensing"))
        ? "Regulatory maturity depends on the named applicant, licensing path, public NRC status, and ownership of licensing risk."
        : "Regulatory maturity was not directly evidenced by the entered note.",
      evidenceTier: "inferred",
    },
    commercialOfftakeCredibility: {
      title: "Commercial / offtake credibility",
      assessment: result.deploymentLayerFindings.some((finding) => finding.layer.includes("Offtake"))
        ? "Offtake credibility requires binding customer terms, credit support, pricing framework, and termination rights."
        : "Commercial offtake was not directly evidenced by the entered note.",
      evidenceTier: "unknowable_from_public_docs",
    },
    unsupportedClaims: result.deploymentLayerFindings.slice(0, 5).map((finding, index) => ({
      id: `input-claim-${index + 1}`,
      claim: `${finding.layer}: ${finding.finding}`,
      evidenceTier: finding.status === "plausible" ? "inferred" : finding.status === "private diligence required" ? "unknowable_from_public_docs" : "missing",
      whyItMatters: finding.whyItMatters,
      requiredEvidence: finding.requiredEvidence,
    })),
  };

  updated.counterpartyQuestions = result.firstPassIcMemo.diligenceQuestions.slice(0, 8).map((question, index) => ({
    id: `input-q-${index + 1}`,
    question,
    whyItMatters: "This question tests whether the entered claim is backed by diligence-grade evidence.",
    expectedEvidence: result.deploymentLayerFindings[index]?.requiredEvidence ?? "Counterparty-provided evidence and accountable owner.",
    priority: index < 5 ? "must-answer" : "important",
    status: "missing",
  }));

  updated.unknowns = result.deploymentLayerFindings.slice(0, 6).map((finding, index) => ({
    id: `input-unk-${index + 1}`,
    unknown: finding.finding,
    whyItMatters: finding.whyItMatters,
    whoShouldAnswer: "Counterparty executive owner or responsible project lead",
    requiredEvidence: finding.requiredEvidence,
    evidenceTier: finding.status === "private diligence required" ? "unknowable_from_public_docs" : "missing",
    status: finding.status === "private diligence required" ? "unknowable_from_public_docs" : "missing",
    severity: index < 4 ? "high" : "medium",
    owner: finding.layer,
    nextStep: `Request evidence for ${finding.layer}.`,
  }));

  return updated;
}
