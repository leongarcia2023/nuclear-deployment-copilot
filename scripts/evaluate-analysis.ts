import fs from "node:fs/promises";
import path from "node:path";
import * as analysisModule from "../src/lib/analysis/analyzeInput";
import * as exportModule from "../src/components/ExportPanel";

type StringMap = Record<string, string>;

type EvalCase = {
  id: string;
  target: string;
  userType?: string;
  user_type?: string;
  decisionQuestion?: string;
  decision_question?: string;
  claimText?: string;
  claim_text?: string;
  expectedDetectedClaimTypes?: string[];
  expected_atomic_claim_types?: string[];
  forbiddenDetectedClaimTypes?: string[];
  expectedDeploymentLayers?: string[];
  expected_deployment_layers?: string[];
  expectedTopMissingEvidence?: string[];
  expected_top_missing_evidence?: string[];
  expectedTargetSpecificSupport?: StringMap;
  expectedCorpusCoverage?: StringMap;
  expectedVerdict?: string;
  expected_verdict?: string;
  expectedAnalystReadContains?: string[];
  forbiddenMemoPhrases?: string[];
  expectedQuestionsContain?: string[];
  expectedRelevantSourceFamilies?: string[];
  expectedMainMemoSourceFamilies?: string[];
  forbiddenRelevantSourceFamilies?: string[];
  maxRelevantPublicEvidenceBullets?: number;
  expected_relevant_documents?: string[];
  expected_target_specific_support_statuses?: string[];
};

type AssertionFailure = {
  category: string;
  message: string;
};

const analyzeInput = (analysisModule as any).analyzeInput ?? (analysisModule as any).default?.analyzeInput;
const icMemoMarkdown = (exportModule as any).icMemoMarkdown ?? (exportModule as any).default?.icMemoMarkdown;

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function includesLoose(haystack: string, needle: string) {
  const normalizedNeedle = normalize(needle);
  if (!normalizedNeedle) return true;
  return normalize(haystack).includes(normalizedNeedle);
}

function includesAny(values: string[], expected: string) {
  return values.some((value) => includesLoose(value, expected));
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function sectionBetween(markdown: string, heading: string) {
  const start = markdown.indexOf(`## ${heading}`);
  if (start < 0) return "";
  const rest = markdown.slice(start + heading.length + 3);
  const next = rest.search(/\n##\s+/);
  return next >= 0 ? rest.slice(0, next) : rest;
}

const alwaysForbiddenMemoPhrases = [
  "being evaluated for:",
  "Read this as a first-pass diligence screen",
  "Palisades shows DOE-level HALEU allocation constraints",
  "Palisades shows DOE level HALEU allocation constraints",
  "Palisades shows DOE-level HALEU program context",
];

function getCaseValue(testCase: EvalCase, camel: keyof EvalCase, snake: keyof EvalCase, fallback = "") {
  return String(testCase[camel] ?? testCase[snake] ?? fallback);
}

function getCaseArray(testCase: EvalCase, camel: keyof EvalCase, snake?: keyof EvalCase) {
  const value = testCase[camel] ?? (snake ? testCase[snake] : undefined) ?? [];
  return Array.isArray(value) ? value.map(String) : [];
}

function fail(category: string, message: string): AssertionFailure {
  return { category, message };
}

function statusMatches(actual: string | undefined, expected: string) {
  if (!actual) return false;
  return includesLoose(actual, expected) || includesLoose(expected, actual);
}

function formatSnapshot(testCase: EvalCase, result: any, memoMarkdown: string, failures: AssertionFailure[]) {
  return `# Eval Failure: ${testCase.id}

Target: ${testCase.target}
User type: ${getCaseValue(testCase, "userType", "user_type")}
Decision: ${getCaseValue(testCase, "decisionQuestion", "decision_question")}

## Claim
${getCaseValue(testCase, "claimText", "claim_text")}

## Failures
${failures.map((item) => `- ${item.category}: ${item.message}`).join("\n")}

## Detected Claim Types
${unique(result.detectedClaims.map((claim: any) => claim.claimType)).map((item) => `- ${item}`).join("\n")}

## Deployment Layers
${unique((result.evidenceLedger?.deploymentLayerSummary ?? result.documentCoverage ?? []).map((item: any) => item.layer)).map((item) => `- ${item}`).join("\n")}

## Memo Snapshot
${memoMarkdown}
`;
}

async function main() {
  if (!analyzeInput) throw new Error("analyzeInput export not found");
  if (!icMemoMarkdown) throw new Error("icMemoMarkdown export not found");

  const evalPath = path.join(process.cwd(), "data", "eval_claims.sample.json");
  const cases = JSON.parse(await fs.readFile(evalPath, "utf8")) as EvalCase[];
  const snapshotDir = path.join(process.cwd(), "data", "eval_memo_snapshots");
  await fs.rm(snapshotDir, { recursive: true, force: true });
  await fs.mkdir(snapshotDir, { recursive: true });

  const results = [];

  for (const testCase of cases) {
    const userType = getCaseValue(testCase, "userType", "user_type", "Investor");
    const decisionQuestion = getCaseValue(testCase, "decisionQuestion", "decision_question", "Is this worth deeper diligence?");
    const claimText = getCaseValue(testCase, "claimText", "claim_text");
    const result = analyzeInput({
      targetCompanyProject: testCase.target,
      userType,
      decisionQuestion,
      note: claimText,
    });

    const memoMarkdown = icMemoMarkdown(
      result.firstPassIcMemo,
      result.relevantPublicEvidenceNotes ?? [],
      result.sourceCoverage ?? [],
      result.detectedClaims ?? [],
      result.deploymentLayerFindings ?? [],
      result.documentCoverage ?? [],
      result.relevantDocuments ?? [],
      result.evidenceLedger,
    );

    const atomicClaims = result.evidenceLedger?.atomicClaims ?? [];
    const detectedClaimTypes = unique(result.detectedClaims.map((claim: any) => claim.claimType));
    const atomicClaimTypes = unique(atomicClaims.map((claim: any) => claim.claimType));
    const allClaimTypes = unique([...detectedClaimTypes, ...atomicClaimTypes]);
    const coverage = result.evidenceLedger?.deploymentLayerSummary ?? result.documentCoverage ?? [];
    const deploymentLayers = unique([
      ...coverage.map((item: any) => item.layer),
      ...(result.deploymentLayerFindings ?? []).map((item: any) => item.layer),
      ...atomicClaims.flatMap((claim: any) => claim.deploymentLayers ?? []),
    ]);
    const evidenceStatuses = unique(atomicClaims.map((claim: any) => claim.evidenceStatus));
    const targetSpecificSupportByLayer: StringMap = Object.fromEntries(coverage.map((item: any) => [item.layer, item.targetSpecificSupport]));
    const corpusCoverageByLayer: StringMap = Object.fromEntries(coverage.map((item: any) => [item.layer, item.corpusCoverage]));
    const targetSpecificSupportStatuses = unique(Object.values(targetSpecificSupportByLayer));
    const matchedChunks = atomicClaims.flatMap((claim: any) => claim.matchedChunks.map((chunk: any) => ({
      claim_id: claim.id,
      claim_type: claim.claimType,
      document_title: chunk.documentTitle,
      rank: chunk.rank,
      deployment_layers: chunk.deploymentLayers,
    })));
    const matchedDocuments = unique([
      ...matchedChunks.map((chunk: any) => chunk.document_title),
      ...(result.relevantDocuments ?? []).map((document: any) => document.title),
      ...(result.manifestOnlyDocuments ?? []).map((document: any) => document.title),
    ]);
    const sourceFamilyText = [
      ...matchedDocuments,
      ...(result.relevantDocuments ?? []).map((document: any) => document.documentFamily),
      ...(result.manifestOnlyDocuments ?? []).map((document: any) => document.documentFamily),
      ...matchedChunks.flatMap((chunk: any) => chunk.deployment_layers ?? []),
      memoMarkdown,
    ].join("\n");
    const topMissingEvidence = result.evidenceLedger?.topMissingEvidence ?? [];
    const questions = result.firstPassIcMemo?.diligenceQuestions ?? [];
    const mainEvidenceSection = sectionBetween(memoMarkdown, "Relevant public evidence");
    const mainEvidenceBullets = mainEvidenceSection.split("\n").filter((line) => line.trim().startsWith("- "));

    const failures: AssertionFailure[] = [];
    const expectedClaimTypes = getCaseArray(testCase, "expectedDetectedClaimTypes", "expected_atomic_claim_types");
    for (const expected of expectedClaimTypes) {
      if (!allClaimTypes.includes(expected)) failures.push(fail("missing expected claim type", `${expected} not detected`));
    }

    for (const forbidden of getCaseArray(testCase, "forbiddenDetectedClaimTypes")) {
      if (allClaimTypes.includes(forbidden)) failures.push(fail("forbidden claim type detected", `${forbidden} was detected`));
    }

    for (const expected of getCaseArray(testCase, "expectedDeploymentLayers", "expected_deployment_layers")) {
      if (!includesAny(deploymentLayers, expected)) failures.push(fail("missing expected deployment layer", `${expected} not present`));
    }

    const expectedVerdict = testCase.expectedVerdict ?? testCase.expected_verdict;
    if (expectedVerdict && result.verdict !== expectedVerdict) {
      failures.push(fail("verdict mismatch", `expected ${expectedVerdict}, got ${result.verdict}`));
    }

    for (const expected of getCaseArray(testCase, "expectedTopMissingEvidence", "expected_top_missing_evidence")) {
      if (!includesAny(topMissingEvidence, expected) && !includesLoose(memoMarkdown, expected)) {
        failures.push(fail("missing expected top evidence", `${expected} not found in top missing evidence or memo`));
      }
    }

    for (const [layer, expected] of Object.entries(testCase.expectedTargetSpecificSupport ?? {})) {
      const actual = targetSpecificSupportByLayer[layer];
      if (!statusMatches(actual, expected)) failures.push(fail("target-specific support mismatch", `${layer}: expected ${expected}, got ${actual ?? "missing layer"}`));
    }

    for (const [layer, expected] of Object.entries(testCase.expectedCorpusCoverage ?? {})) {
      const actual = corpusCoverageByLayer[layer];
      if (!statusMatches(actual, expected)) failures.push(fail("corpus coverage mismatch", `${layer}: expected ${expected}, got ${actual ?? "missing layer"}`));
    }

    for (const expected of getCaseArray(testCase, "expectedAnalystReadContains")) {
      if (!includesLoose(memoMarkdown, expected)) failures.push(fail("missing analyst read text", `${expected} not found in memo`));
    }

    for (const forbidden of [...alwaysForbiddenMemoPhrases, ...getCaseArray(testCase, "forbiddenMemoPhrases")]) {
      if (includesLoose(memoMarkdown, forbidden)) failures.push(fail("forbidden memo phrase", `${forbidden} appears in memo`));
    }

    for (const expected of getCaseArray(testCase, "expectedQuestionsContain")) {
      if (!includesAny(questions, expected) && !includesLoose(memoMarkdown, expected)) failures.push(fail("missing expected question", `${expected} not found in questions or memo`));
    }

    const expectedSourceFamilies = [
      ...getCaseArray(testCase, "expectedRelevantSourceFamilies"),
      ...getCaseArray(testCase, "expected_relevant_documents"),
    ];
    for (const expected of expectedSourceFamilies) {
      if (!includesLoose(sourceFamilyText, expected)) failures.push(fail("missing expected source family", `${expected} not found in matched documents/chunks/memo`));
    }

    for (const expected of getCaseArray(testCase, "expectedMainMemoSourceFamilies")) {
      if (!includesLoose(mainEvidenceSection, expected)) failures.push(fail("missing expected main memo source family", `${expected} not found in Relevant public evidence`));
    }

    for (const forbidden of getCaseArray(testCase, "forbiddenRelevantSourceFamilies")) {
      if (includesLoose(mainEvidenceSection, forbidden)) failures.push(fail("irrelevant main memo source family", `${forbidden} appears in Relevant public evidence`));
    }

    if (typeof testCase.maxRelevantPublicEvidenceBullets === "number" && mainEvidenceBullets.length > testCase.maxRelevantPublicEvidenceBullets) {
      failures.push(fail("too many public evidence bullets", `expected at most ${testCase.maxRelevantPublicEvidenceBullets}, got ${mainEvidenceBullets.length}`));
    }

    const passed = failures.length === 0;
    if (!passed) {
      await fs.writeFile(
        path.join(snapshotDir, `${testCase.id}.md`),
        formatSnapshot(testCase, result, memoMarkdown, failures),
      );
    }

    results.push({
      id: testCase.id,
      target: testCase.target,
      user_type: userType,
      decision_question: decisionQuestion,
      passed,
      failures,
      detected_claim_types: detectedClaimTypes,
      atomic_claim_types: atomicClaimTypes,
      forbidden_claim_types_checked: getCaseArray(testCase, "forbiddenDetectedClaimTypes"),
      matched_documents: matchedDocuments.slice(0, 15),
      matched_chunks: matchedChunks.slice(0, 20),
      deployment_layers: deploymentLayers,
      evidence_statuses: evidenceStatuses,
      target_specific_support_by_layer: targetSpecificSupportByLayer,
      corpus_coverage_by_layer: corpusCoverageByLayer,
      target_specific_support_statuses: targetSpecificSupportStatuses,
      top_missing_evidence: topMissingEvidence,
      diligence_questions: questions.slice(0, 10),
      verdict: result.verdict,
      main_memo_source_bullets: mainEvidenceBullets,
      memo_word_count: memoMarkdown.split(/\s+/).filter(Boolean).length,
      snapshot_path: passed ? null : `data/eval_memo_snapshots/${testCase.id}.md`,
    });
  }

  const failedResults = results.filter((item) => !item.passed);
  const failureCategories = failedResults
    .flatMap((item) => item.failures.map((failure) => failure.category))
    .reduce<Record<string, number>>((counts, category) => {
      counts[category] = (counts[category] ?? 0) + 1;
      return counts;
    }, {});

  const report = {
    generated_at: new Date().toISOString(),
    total_cases: results.length,
    passed: results.filter((item) => item.passed).length,
    failed: failedResults.length,
    failure_categories: failureCategories,
    results,
  };

  await fs.writeFile(path.join(process.cwd(), "data", "eval_report.json"), JSON.stringify(report, null, 2) + "\n");

  console.log(`eval cases: ${report.total_cases}`);
  console.log(`passed: ${report.passed}`);
  console.log(`failed: ${report.failed}`);
  console.log("failure categories:");
  for (const [category, count] of Object.entries(failureCategories).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${category}: ${count}`);
  }
  for (const item of results) {
    if (item.passed) {
      console.log(`PASS ${item.id}`);
    } else {
      console.log(`FAIL ${item.id}: ${item.failures.slice(0, 4).map((failure) => `${failure.category} - ${failure.message}`).join("; ")}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
