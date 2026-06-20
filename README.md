# Nuclear Deployment Intelligence

Nuclear Deployment Intelligence is a deterministic, source-grounded diligence tool that detects overclaims in advanced nuclear and AI infrastructure deployment narratives.

**Live demo:** [https://nuclear-deployment-copilot-56frv6p3l-leongarcia2023s-projects.vercel.app/](https://nuclear-deployment-copilot-riqd4kd8p-leongarcia2023s-projects.vercel.app/))

## Problem / Motivation

Advanced nuclear deployment announcements often compress many hard questions into a single confident sentence: a reactor will be online by a certain date, HALEU will be available, a data center customer is lined up, NRC engagement is underway, or financing is solved. For investors, fuel-cycle suppliers, strategic partners, and power buyers, the hard part is not writing a memo. The hard part is separating public context from target-specific proof.

This project turns those claims into a structured diligence workflow. It asks: what exactly is being claimed, what deployment layer does that claim depend on, what public evidence exists, what remains missing, and what requires private diligence?

## What the App Does

Users paste a public company claim or sanitized note. The app then:

- Decomposes the input into atomic deployment claims.
- Detects claim types such as NRC engagement, HALEU supply, bridge power, offtake, site control, EPC readiness, and financing.
- Matches the claim against a curated nuclear deployment source corpus.
- Separates corpus coverage from target-specific proof.
- Builds an evidence ledger and deployment stack matrix.
- Produces a concise first-pass diligence / IC memo.
- Assigns a conservative public-evidence screening disposition: Insufficient Input, Overclaim Risk, Diligence Required, or Stronger Public Footing.
- Flags common overclaims, such as treating an MOU as binding offtake or pre-application engagement as NRC approval.

## Architecture Overview

```text
claim intake
  -> deterministic claim analysis
  -> source / corpus matching
  -> evidence ledger
  -> memo + diligence cockpit
```

The deployed version is deterministic. It does not call OpenAI, Anthropic, or any paid AI API at runtime.

The canonical application code lives in `src/app`, with a small top-level `app/` shim that re-exports those routes for deployment compatibility.

## Source Corpus

The current corpus foundation includes:

- A 150-document ranked source manifest.
- Top-25 ingested source documents.
- 2,521 chunked evidence passages.
- NRC, DOE, HALEU, licensing, financing, fuel fabrication, transportation/safeguards, public benchmark, and construction-monitoring materials.

Source data lives primarily in:

- `data/nuclear_deployment_ranked_ingest_plan_150.jsonl`
- `data/source_notes.sample.json`
- `corpus/chunks/document_chunks.jsonl`

## How to Run Locally

```bash
npm install
npm run dev
npm run build
npx tsc --noEmit
npm run eval
```

Open [http://localhost:3000](http://localhost:3000) after `npm run dev`.

## How to Use the App

1. Open Deal Diligence.
2. Paste a public claim or sanitized note, or run the flagship demo.
3. Select user type and decision question.
4. Generate the memo.
5. Review the verdict, evidence posture, deployment stack matrix, claim chips, missing evidence, public context, and diligence questions.
6. Use Source Library to inspect the source manifest and corpus foundation.
7. Use Methodology to review the deployment risk framework.

## Demo Presets

The app includes deterministic demo presets for:

- Helios Compute Campus flagship demo.
- HALEU fuel-readiness claim.
- NRC pre-application to 2030 COD.
- DOE award vs closed financing.
- MOU vs binding offtake.

The flagship demo claim is:

> Helios claims it can deploy a 300 MW behind-the-meter AI data center campus by 2031 using bridge power in Phase 1 and advanced nuclear baseload in Phase 3, supported by a hyperscaler MOU and ongoing NRC engagement.

## Evaluation

The project includes an internal evaluation harness:

- 80 adversarial eval cases.
- 10 golden memo regression tests.
- Memo quality metrics, including word count, evidence bullet count, and diligence question count.
- Overclaim checks for common diligence errors.
- Screening-disposition checks to prevent constant verdicts.
- Evidence posture checks to ensure the app distinguishes weak, mixed, and stronger public footing while keeping verdicts conservative.

Run:

```bash
npm run eval
```

Recent passing output includes:

- 80/80 eval cases passed.
- 10/10 golden memo tests passed.
- Screening disposition distribution across Overclaim Risk, Diligence Required, Stronger Public Footing, and Insufficient Input.
- Evidence posture distribution across Weak Public Footing, Mixed Public Footing, and Stronger Public Footing.
- Zero forbidden overclaim cases.
- Zero generic fallback cases.

## Limitations

This project is a first-pass diligence prototype, not final investment advice.

The headline verdict is a public-evidence screening disposition. It does not verify private contracts, financing terms, site rights, confidential counterparty evidence, or non-public regulatory feedback. `Stronger Public Footing` does not mean approved, bankable, safe, or investable. It only means the claim has stronger public evidence relative to other screened claims, while remaining subject to private diligence on contracts, financing, execution, and counterparty credibility.

Known limitations:

- It does not verify private contracts, financing terms, site rights, or confidential counterparty materials.
- It does not replace expert nuclear, legal, regulatory, commercial, or investment diligence.
- Only the top 25 documents are currently chunk-backed.
- The 150-source manifest is broader than the ingested text corpus.
- Deterministic retrieval can miss nuance and may not capture every relevant public document.
- The deployed version does not make paid AI API calls.

## AI Usage Disclosure

AI coding assistants, including ChatGPT, Claude, and Codex, were used during development for brainstorming, code generation, debugging, prompt iteration, adversarial review, and documentation support.

The deployed application itself does not call OpenAI, Anthropic, or other paid AI APIs. Runtime analysis is deterministic and source-grounded against the local manifest and chunked corpus.

Final code paths were reviewed and validated with:

```bash
npm run eval
npm run build
npx tsc --noEmit
```

## Sources / Corpus Attribution

The source corpus is based on public materials from organizations including NRC, DOE, public regulatory dockets, source manifests, and public benchmark precedents. Source cards and document records include URLs where available. The app is designed to use public-source context as context, not as proof of target-specific private commitments.

## Future Work

Potential next steps:

- Expand from top-25 ingestion to top-75 corpus coverage.
- Add optional AI synthesis after evidence-ledger behavior remains stable.
- Improve deterministic and/or hybrid retrieval quality.
- Add a V3 siting intelligence layer for location, interconnection, water, permitting, and local risk.
- Expand source coverage for ISO/RTO interconnection, financing, offtake, construction, and company filings.
