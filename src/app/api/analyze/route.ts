import { NextRequest, NextResponse } from "next/server";
import demoProfile from "../../../../data/demo_project_profile.sample.json";
import { analysisModeCopy } from "@/lib/analysis/analysisModes";
import { analyzeInput, applyMemoResult } from "@/lib/analysis/analyzeInput";
import type { AppAnalysisMode, ClaimToIcMemo, ProjectCounterpartyProfile } from "@/types/core";

const baseProfile = demoProfile as ProjectCounterpartyProfile;

type DemoId = "data-center-campus" | "haleu-readiness" | "nrc-preapp-2030" | "doe-award-financing" | "mou-offtake" | "smr-data-center" | "haleu-customer" | "deployment-timeline";

function cloneProfile(): ProjectCounterpartyProfile {
  return JSON.parse(JSON.stringify(baseProfile)) as ProjectCounterpartyProfile;
}

function withMemo(overrides: Partial<ClaimToIcMemo>): ProjectCounterpartyProfile {
  const profile = cloneProfile();
  profile.claimToIcMemo = {
    ...profile.claimToIcMemo,
    ...overrides,
    firstPassIcMemo: {
      ...profile.claimToIcMemo.firstPassIcMemo,
      ...(overrides.firstPassIcMemo ?? {}),
    },
  };
  return profile;
}

function profileForDemo(demoId: DemoId): ProjectCounterpartyProfile {
  if (demoId === "haleu-customer" || demoId === "haleu-readiness") {
    return withMemo({
      verdict: "Monitor",
      confidence: "Medium",
      oneLineJudgment:
        "Monitor, but do not reserve fuel-cycle capacity yet. The claimed HALEU demand is commercially relevant, but customer maturity, fuel specification, credit support, and reservation authority are not evidenced.",
      recommendedNextAction:
        "Ask for a supplier-facing demand package: assay, quantity, form, delivery windows, fabrication route, credit support, and decision authority.",
      unsupportedClaims: [
        {
          id: "claim-haleu-001",
          claim: "The developer will need material HALEU volumes within the supplier planning window.",
          evidenceTier: "sanitized_user_note",
          whyItMatters: "Supplier capacity decisions depend on credible timing and quantity, not generic advanced-reactor demand.",
          requiredEvidence: "First-core and reload schedule with assay, form, quantity, and delivery-window detail.",
        },
        {
          id: "claim-haleu-002",
          claim: "The counterparty can commit before final licensing or financing certainty.",
          evidenceTier: "missing",
          whyItMatters: "Reservation demand is not bankable without credit support and cancellation economics.",
          requiredEvidence: "Board authority, parent support, deposit, escrow, or other supplier-protective reservation terms.",
        },
        {
          id: "claim-haleu-003",
          claim: "Fabrication and conversion interfaces are already understood.",
          evidenceTier: "inferred",
          whyItMatters: "Fuel supply is not just enrichment; downstream interfaces can become the gating risk.",
          requiredEvidence: "Interface control document, fabrication partner scope, qualification plan, and fallback route.",
        },
        {
          id: "claim-haleu-004",
          claim: "Commercial deployment timing supports near-term fuel procurement.",
          evidenceTier: "inferred",
          whyItMatters: "A slipping deployment schedule converts valuable inventory into stranded optionality.",
          requiredEvidence: "Integrated project schedule tied to site, licensing, offtake, and financing milestones.",
        },
        {
          id: "claim-haleu-005",
          claim: "The buyer is creditworthy enough for scarce supply allocation.",
          evidenceTier: "unknowable_from_public_docs",
          whyItMatters: "Supplier exposure depends on counterparty balance sheet and enforceability.",
          requiredEvidence: "Credit package, guarantee, customer contract, or milestone-backed payment structure.",
        },
      ],
      timelineCredibility: {
        title: "Timeline credibility",
        assessment: "The schedule is not yet supplier-bankable because fuel need is not tied to public deployment milestones or binding procurement authority.",
        evidenceTier: "inferred",
      },
      fuelCycleReadiness: {
        title: "Fuel-cycle readiness",
        assessment: "Demand could be valuable, but the proof package is incomplete across assay, quantity, conversion, fabrication, qualification, and credit support.",
        evidenceTier: "missing",
      },
      regulatoryMaturity: {
        title: "Regulatory / NRC status",
        assessment: "Regulatory maturity matters mostly because it controls when the fuel commitment becomes real rather than optional.",
        evidenceTier: "inferred",
      },
      commercialOfftakeCredibility: {
        title: "Commercial / offtake credibility",
        assessment: "Fuel demand should be discounted until offtake, financing, and reservation economics support a binding supply commitment.",
        evidenceTier: "unknowable_from_public_docs",
      },
      firstPassIcMemo: {
        target: "Prospective HALEU fuel-cycle customer",
        decision: "Is this a credible fuel-cycle customer?",
        verdict: "Monitor",
        confidence: "Medium",
        situation:
          "A reactor developer claims it will become a meaningful HALEU customer and wants strategic fuel-cycle engagement before final project maturity.",
        thesis:
          "The counterparty may become valuable demand, but the current evidence supports monitoring and structured diligence rather than capacity reservation.",
        whatIsEvidenced: [
          "Advanced reactor programs can create material HALEU demand.",
          "Supplier scarcity makes early reservation behavior commercially important.",
          "Fuel-cycle bottlenecks are central to advanced reactor deployment credibility.",
        ],
        whatIsNotYetEvidenced: [
          "Binding fuel reservation authority.",
          "Assay-specific demand schedule.",
          "Conversion, fabrication, and qualification route.",
          "Credit support for scarce capacity allocation.",
          "Deployment milestones that justify near-term procurement.",
        ],
        majorKillRisks: [
          "No enforceable reservation economics.",
          "Fuel specification remains too immature for supplier planning.",
          "Deployment timeline slips beyond the supply window.",
          "Fabrication or qualification route is not executable.",
          "Counterparty cannot support credit exposure.",
        ],
        whatMustBeTrue: [
          "The developer has authority and credit support to reserve fuel-cycle capacity.",
          "Fuel specification and delivery windows are supplier-actionable.",
          "Fabrication and qualification interfaces are mapped.",
          "Project timeline justifies near-term procurement.",
          "Supplier downside is protected if deployment slips.",
        ],
        diligenceQuestions: [
          "What HALEU assay, form, quantity, and delivery windows are required?",
          "Who has authority to sign a reservation before construction permit or FID?",
          "What credit support or cancellation economics can protect the supplier?",
          "Who owns fabrication, qualification, and interface control?",
          "Which project milestones trigger procurement, deferral, or cancellation?",
        ],
        recommendedNextStep:
          "Hold a supplier diligence call and request a sanitized fuel-demand package before discussing priority capacity allocation.",
        sourcesAndEvidenceNotes: [
          "Public evidence can support market context, not private procurement authority.",
          "Sanitized notes should be treated as claims until backed by supplier-actionable evidence.",
          "Private contracts and credit support cannot be verified from public documents.",
        ],
      },
    });
  }

  if (demoId === "deployment-timeline" || demoId === "nrc-preapp-2030") {
    return withMemo({
      verdict: "Diligence Required",
      confidence: "Low",
      oneLineJudgment:
        "Diligence required with low confidence in the announced timeline. The deployment date is the claim most likely to break unless licensing, site, EPC, fuel, and financing evidence are already much more mature than public signals suggest.",
      recommendedNextAction:
        "Do not underwrite the announced date. Build a milestone-based timeline case and require evidence for each critical path item.",
      unsupportedClaims: [
        {
          id: "claim-time-001",
          claim: "Commercial deployment can occur by the announced date.",
          evidenceTier: "inferred",
          whyItMatters: "Timeline credibility drives valuation, customer commitments, and capital pacing.",
          requiredEvidence: "Critical path schedule with NRC, site, EPC, fuel, offtake, and financing milestones.",
        },
        {
          id: "claim-time-002",
          claim: "NRC engagement is sufficient for the deployment date.",
          evidenceTier: "public_source_verified",
          whyItMatters: "Early engagement is not the same as licensing maturity.",
          requiredEvidence: "Docket artifacts, licensing strategy, review schedule, and open issue tracker.",
        },
        {
          id: "claim-time-003",
          claim: "Site and permitting can move in parallel without delaying construction.",
          evidenceTier: "missing",
          whyItMatters: "Site control and local permitting often become schedule governors.",
          requiredEvidence: "Site control, permit matrix, interconnection, community record, and security plan.",
        },
        {
          id: "claim-time-004",
          claim: "EPC and supply-chain execution can support the claimed date.",
          evidenceTier: "missing",
          whyItMatters: "Construction execution is the core risk in nuclear deployment underwriting.",
          requiredEvidence: "EPC scope, cost basis, contractor readiness, procurement plan, and contingency schedule.",
        },
        {
          id: "claim-time-005",
          claim: "Financing will be available at the pace implied by the timeline.",
          evidenceTier: "unknowable_from_public_docs",
          whyItMatters: "Financing cadence must match project maturity, not just market appetite.",
          requiredEvidence: "Sources and uses, milestone capital plan, grants, customer credit, and downside case.",
        },
      ],
      timelineCredibility: {
        title: "Timeline credibility",
        assessment: "The announced date should be treated as a management target, not a base case. Public evidence is insufficient to underwrite it.",
        evidenceTier: "inferred",
      },
      firstPassIcMemo: {
        target: "Advanced reactor deployment timeline claim",
        decision: "Is this timeline believable?",
        verdict: "Diligence Required",
        confidence: "Low",
        situation:
          "A developer claims it can move from current project maturity to commercial advanced reactor deployment within a compressed timeline.",
        thesis:
          "The timeline is potentially interesting but should not be underwritten without evidence that licensing, site, EPC, fuel, offtake, and financing are already synchronized.",
        whatIsEvidenced: [
          "Public regulatory engagement may exist for the reactor concept.",
          "Advanced reactor demand narratives are commercially relevant.",
          "Comparable projects show that public milestones can materially lag announced ambition.",
        ],
        whatIsNotYetEvidenced: [
          "Critical path schedule with owners and dependencies.",
          "Site control and permitting readiness.",
          "EPC scope and construction risk allocation.",
          "Fuel availability aligned to commissioning.",
          "Financing plan matched to project maturity.",
        ],
        majorKillRisks: [
          "Licensing path cannot support the announced date.",
          "Site or interconnection milestones slip.",
          "EPC readiness is not real.",
          "Fuel delivery is incompatible with commissioning.",
          "Capital plan assumes infrastructure risk before project de-risking.",
        ],
        whatMustBeTrue: [
          "NRC path supports the claimed deployment date.",
          "Site, permitting, and local acceptance are already advanced.",
          "EPC and supply-chain risk are owned by credible counterparties.",
          "Fuel is available on the commissioning schedule.",
          "Financing is milestone-based and matched to actual maturity.",
        ],
        diligenceQuestions: [
          "What is the critical path from today to commercial operation?",
          "Which NRC milestones are complete, filed, or scheduled?",
          "What site and interconnection milestones are already secured?",
          "Who owns EPC schedule, cost overrun, and procurement risk?",
          "What milestone would force management to revise the deployment date?",
        ],
        recommendedNextStep:
          "Build an independent timeline bridge and require evidence for each critical-path dependency before assigning value to the announced date.",
        sourcesAndEvidenceNotes: [
          "Public milestones can validate direction but rarely prove commercial timing alone.",
          "Private NRC feedback, EPC bids, and financing commitments require permissioned diligence.",
          "Comparable projects should be used to haircut announced timelines.",
        ],
      },
    });
  }

  return cloneProfile();
}


export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { demoId?: DemoId; sanitizedNotes?: string; publicQuery?: string; decisionQuestion?: string; userType?: string; analysisMode?: AppAnalysisMode };
  const demoId = body.demoId ?? "smr-data-center";
  let profile = profileForDemo(demoId);
  const analysisMode = body.analysisMode ?? "demo";
  const inputResult = analyzeInput({
    targetCompanyProject: body.publicQuery ?? "",
    note: body.sanitizedNotes ?? "",
    userType: body.userType ?? "Investor",
    decisionQuestion: body.decisionQuestion ?? "Is this worth deeper diligence?",
    analysisMode,
  });
  profile = applyMemoResult(profile, inputResult);
  profile.claimToIcMemo.analysisMode = analysisMode;
  profile.claimToIcMemo.analysisModeNote = analysisModeCopy[analysisMode].note;

  return NextResponse.json({
    profile,
    generatedBy: "demo_mode_deterministic_fixture_with_curated_public_corpus",
    llmCalls: false,
  });
}
