import companyProfiles from "../../../data/company_profiles.sample.json";
import { matchSources } from "@/lib/sources/matchSources";
import { rankDocumentsForClaim } from "@/lib/documents/rankDocumentsForClaim";
import type { SourceMatchResult } from "@/lib/sources/sourceTypes";
import type {
  AnalysisInput,
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
  data_center_power_claim: ["data center", "compute", "ai campus", "hyperscaler", "load", "large load"],
  behind_the_meter_claim: ["behind the meter", "behind-the-meter", "islanded", "private grid", "off-grid", "colocated", "co-located"],
  fuel_cycle_claim: ["fuel cycle", "fuel-cycle", "fabrication", "conversion", "deconversion", "supply chain"],
  HALEU_claim: ["haleu", "high-assay", "enrichment", "assay", "first core", "reload"],
  licensing_claim: ["construction permit", "cola", "license", "licensing", "regulatory approval"],
  NRC_engagement_claim: ["nrc", "pre-application", "regulatory engagement", "readiness assessment", "application review"],
  deployment_timeline_claim: ["2030", "2031", "2032", "deploy", "deployment", "cod", "first power", "commercial operation"],
  offtake_claim: ["offtake", "customer", "ppa", "power purchase", "hyperscaler", "anchor tenant", "long-term contract"],
  site_control_claim: ["site", "land", "controlled", "control", "permit", "permitting", "campus", "location"],
  financing_claim: ["financing", "project finance", "lpo", "loan", "debt", "equity", "funding", "capex"],
  EPC_construction_claim: ["epc", "construction", "contractor", "build", "modular", "supply chain", "cost overrun"],
  bridge_power_claim: ["bridge power", "fuel cell", "gas", "turbine", "phase 1", "initial energization", "temporary power"],
  nuclear_integration_claim: ["nuclear", "reactor", "smr", "advanced reactor", "baseload", "small modular"],
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

function includesPhrase(haystack: string, phrase: string) {
  return haystack.includes(normalize(phrase));
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
    .filter((item) => item.triggeredKeywords.length > 0)
    .map((item) => ({
      claimType: item.claimType,
      label: claimLabels[item.claimType],
      triggeredKeywords: item.triggeredKeywords,
      deploymentLayers: layerMap[item.claimType],
    }));

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
  if (claimTypes.has("deployment_timeline_claim") || claimTypes.has("HALEU_claim")) return "Diligence Required";
  return "Monitor";
}

function buildQuestions(target: string, profile: CompanyProfile | undefined, findings: DeploymentLayerFinding[], detectedClaims: DetectedClaim[]) {
  const base = profile?.default_diligence_questions ?? [];
  const layerQuestions = findings.slice(0, 5).map((finding) => `What evidence can ${target} provide for ${finding.layer}: ${finding.requiredEvidence}`);
  const claimQuestions = detectedClaims.slice(0, 3).map((claim) => `Which documents support the ${claim.label} triggered by: ${claim.triggeredKeywords.join(", ")}?`);
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

function buildMemo(input: AnalysisInput, profile: CompanyProfile | undefined, detectedClaims: DetectedClaim[], findings: DeploymentLayerFinding[], sourceMatch: SourceMatchResult): MemoResult {
  const target = input.targetCompanyProject.trim() || profile?.name || "the target counterparty";
  const category = profile?.category ?? "unrecognized_counterparty";
  const verdict = verdictFor(profile, detectedClaims);
  const confidence = sourceMatch.confidence;
  const questions = buildQuestions(target, profile, findings, detectedClaims);
  const claimLabelsList = detectedClaims.map((claim) => claim.label);
  const topFindings = findings.slice(0, 6);

  const documentMatch = rankDocumentsForClaim({ detectedClaims, deploymentLayerFindings: findings, limit: 8 });
  const relevantDocuments = documentMatch.relevantDocuments.map(toMemoRelevantDocument);
  const documentCoverage = documentMatch.documentCoverage.map((item) => ({
    layer: item.layer,
    status: item.status,
    matchedCount: item.matchedCount,
    topDocuments: item.topDocuments.map(toMemoRelevantDocument),
  }));
  const isShuffleLike = category === "data_center_power_infrastructure";
  const oneLineJudgment = isShuffleLike
    ? `${target} appears to be a data-center power infrastructure diligence case, not a reactor developer case. Treat nuclear as long-term optionality unless site control, initial power, customer/offtake, reactor vendor, licensing responsibility, EPC, and fuel-cycle evidence are provided.`
    : `${target} requires input-specific diligence across ${topFindings.map((item) => item.layer).join(", ") || "the relevant deployment layers"}; current deterministic analysis does not support treating the claim as bankable without proof.`;

  const recommendedNextAction = isShuffleLike
    ? `For ${target}, diligence the power-campus stack first: site rights, initial energization source, customer/offtake, bridge-power economics, and whether nuclear is base case or upside. Then require the named reactor vendor and licensing owner.`
    : `Ask ${target} for layer-specific evidence for the detected claims before treating the deployment timeline or commercial claim as bankable.`;

  const whatIsEvidenced = [
    `${target} was analyzed using the entered target name, user type (${input.userType}), decision question (${input.decisionQuestion}), and claim text.`,
    profile ? `${target} matched the company profile category: ${profile.category}.` : `${target} did not match a curated company profile, so the memo uses keyword-detected claim types only.`,
    detectedClaims.length ? `Detected claim types: ${claimLabelsList.join(", ")}.` : "No major claim type was detected from the current note.",
    ...(sourceMatch.relevantSourceNotes.length
      ? sourceMatch.relevantSourceNotes.slice(0, 3).map((note) => `Public evidence note: ${note.title} establishes ${note.what_it_establishes.toLowerCase()}`)
      : []),
    ...(relevantDocuments.length
      ? relevantDocuments.slice(0, 3).map((document) => `Manifest document #${document.rank}: ${document.title} supports ${document.deploymentLayers.join(", ")}.`)
      : []),
  ];

  const sourceMissing = [
    ...sourceMatch.unsupportedLayers.map((layer) => `${layer}: no public source in the current corpus supports this claim.`),
    ...sourceMatch.privateDiligenceLayers.map((layer) => `${layer}: requires private diligence or cannot be resolved from public documents alone.`),
  ];
  const whatIsNotYetEvidenced = (isShuffleLike
    ? [
        "Binding site-control package and permitting path for the claimed campus scale.",
        "Initial energization source, cost, reliability, and bridge-power duration.",
        "Binding customer/offtake agreement or creditworthy load commitment.",
        "Named reactor vendor, licensing applicant, fuel-cycle path, and construction owner for nuclear baseload.",
        "Plan for what happens if nuclear slips 5-10 years.",
      ]
    : topFindings.map((finding) => `${finding.layer}: ${finding.requiredEvidence}`)).concat(sourceMissing).filter((item, index, array) => array.indexOf(item) === index);

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
      whatMustBeTrue,
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
    documentCoverage,
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
