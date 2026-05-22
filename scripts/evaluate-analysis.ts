import fs from "node:fs/promises";
import path from "node:path";
import * as analysisModule from "../src/lib/analysis/analyzeInput";

type EvalCase = {
  id: string;
  target: string;
  user_type: string;
  decision_question: string;
  claim_text: string;
  expected_atomic_claim_types: string[];
  expected_deployment_layers: string[];
  expected_relevant_documents: string[];
  expected_target_specific_support_statuses: string[];
  expected_top_missing_evidence: string[];
  expected_verdict: string;
};

const analyzeInput = (analysisModule as any).analyzeInput ?? (analysisModule as any).default?.analyzeInput;

function includesAny(values: string[], expected: string) {
  const needle = expected.toLowerCase();
  return values.some((value) => value.toLowerCase().includes(needle));
}

function missing(expected: string[], actual: string[]) {
  return expected.filter((item) => !includesAny(actual, item));
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

async function main() {
  if (!analyzeInput) throw new Error("analyzeInput export not found");
  const evalPath = path.join(process.cwd(), "data", "eval_claims.sample.json");
  const cases = JSON.parse(await fs.readFile(evalPath, "utf8")) as EvalCase[];
  const results = cases.map((testCase) => {
    const result = analyzeInput({
      targetCompanyProject: testCase.target,
      userType: testCase.user_type,
      decisionQuestion: testCase.decision_question,
      note: testCase.claim_text,
    });
    const atomicClaims = result.evidenceLedger?.atomicClaims ?? [];
    const detectedClaimTypes = unique(result.detectedClaims.map((claim: any) => claim.claimType));
    const atomicClaimTypes = unique(atomicClaims.map((claim: any) => claim.claimType));
    const deploymentLayers = unique((result.evidenceLedger?.deploymentLayerSummary ?? result.documentCoverage ?? []).map((item: any) => item.layer));
    const evidenceStatuses = unique(atomicClaims.map((claim: any) => claim.evidenceStatus));
    const targetSpecificSupportStatuses = unique((result.evidenceLedger?.deploymentLayerSummary ?? result.documentCoverage ?? []).map((item: any) => item.targetSpecificSupport));
    const matchedChunks = unique(atomicClaims.flatMap((claim: any) => claim.matchedChunks.map((chunk: any) => chunk.documentTitle)));
    const matchedDocuments = unique([
      ...matchedChunks,
      ...(result.relevantDocuments ?? []).map((document: any) => document.title),
      ...(result.manifestOnlyDocuments ?? []).map((document: any) => document.title),
    ]);
    const topMissingEvidence = result.evidenceLedger?.topMissingEvidence ?? [];
    const failures = [
      ...missing(testCase.expected_atomic_claim_types, [...atomicClaimTypes, ...detectedClaimTypes]).map((item) => `missing claim type: ${item}`),
      ...missing(testCase.expected_deployment_layers, deploymentLayers).map((item) => `missing layer: ${item}`),
      ...(result.verdict === testCase.expected_verdict ? [] : [`verdict expected ${testCase.expected_verdict}, got ${result.verdict}`]),
    ];
    const advisoryNotes = [
      ...missing(testCase.expected_relevant_documents, matchedDocuments).map((item) => `missing document: ${item}`),
      ...missing(testCase.expected_target_specific_support_statuses, targetSpecificSupportStatuses).map((item) => `missing target support status: ${item}`),
      ...missing(testCase.expected_top_missing_evidence, topMissingEvidence).map((item) => `missing top evidence item: ${item}`),
    ];

    return {
      id: testCase.id,
      target: testCase.target,
      passed: failures.length === 0,
      pass_fail_notes: failures.length ? failures : ["pass"],
      advisory_notes: advisoryNotes.length ? advisoryNotes : ["none"],
      detected_claim_types: detectedClaimTypes,
      atomic_claim_types: atomicClaimTypes,
      matched_documents: matchedDocuments.slice(0, 12),
      matched_chunks: atomicClaims.flatMap((claim: any) => claim.matchedChunks.map((chunk: any) => ({
        claim_id: claim.id,
        claim_type: claim.claimType,
        document_title: chunk.documentTitle,
        rank: chunk.rank,
        deployment_layers: chunk.deploymentLayers,
      }))).slice(0, 20),
      deployment_layers: deploymentLayers,
      evidence_statuses: evidenceStatuses,
      target_specific_support_statuses: targetSpecificSupportStatuses,
      top_missing_evidence: topMissingEvidence,
      verdict: result.verdict,
    };
  });

  const report = {
    generated_at: new Date().toISOString(),
    total_cases: results.length,
    passed: results.filter((item) => item.passed).length,
    failed: results.filter((item) => !item.passed).length,
    results,
  };

  await fs.writeFile(path.join(process.cwd(), "data", "eval_report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(`eval cases: ${report.total_cases}`);
  console.log(`passed: ${report.passed}`);
  console.log(`failed: ${report.failed}`);
  for (const result of results.filter((item) => !item.passed).slice(0, 10)) {
    console.log(`${result.id}: ${result.pass_fail_notes.join("; ")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
