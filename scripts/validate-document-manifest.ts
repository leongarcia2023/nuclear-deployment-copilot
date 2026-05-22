import fs from "node:fs/promises";
import path from "node:path";

type ManifestDoc = {
  id?: string;
  rank?: number;
  title?: string;
  url?: string;
  source_url?: string;
  adams_accession?: string;
};

type ValidationResult = {
  id: string;
  rank: number | null;
  title: string;
  url: string;
  status: "valid" | "failed" | "unchecked";
  http_status: number | null;
  content_type: string | null;
  final_url: string | null;
  validation_error: string | null;
};

const MANIFEST_PATH = path.join(
  process.cwd(),
  "data",
  "nuclear_deployment_ranked_ingest_plan_150.jsonl"
);

const REPORT_PATH = path.join(
  process.cwd(),
  "data",
  "document_validation_report.json"
);

const TIMEOUT_MS = 10_000;
const CONCURRENCY = 5;

function safeId(doc: ManifestDoc, index: number): string {
  if (doc.id) return doc.id;
  const base = doc.title || `document_${index + 1}`;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

async function readManifest(): Promise<ManifestDoc[]> {
  const raw = await fs.readFile(MANIFEST_PATH, "utf8");
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      try {
        return JSON.parse(line);
      } catch (err) {
        throw new Error(`Invalid JSONL at line ${i + 1}: ${line.slice(0, 120)}`);
      }
    });
}

function getUrl(doc: ManifestDoc): string {
  return (doc.url || doc.source_url || "").trim();
}

async function fetchWithTimeout(
  url: string,
  method: "HEAD" | "GET"
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    return await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 NuclearDeploymentIntelligence/0.1 (+local validation script)",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function validateOne(
  doc: ManifestDoc,
  index: number,
  total: number
): Promise<ValidationResult> {
  const id = safeId(doc, index);
  const rank = typeof doc.rank === "number" ? doc.rank : null;
  const title = doc.title || id;
  const url = getUrl(doc);

  console.log(`[${index + 1}/${total}] Validating: ${title}`);

  if (!url) {
    console.log(`  → failed: missing URL`);
    return {
      id,
      rank,
      title,
      url,
      status: "failed",
      http_status: null,
      content_type: null,
      final_url: null,
      validation_error: "Missing URL",
    };
  }

  try {
    new URL(url);
  } catch {
    console.log(`  → failed: malformed URL`);
    return {
      id,
      rank,
      title,
      url,
      status: "failed",
      http_status: null,
      content_type: null,
      final_url: null,
      validation_error: "Malformed URL",
    };
  }

  try {
    let response: Response;

    try {
      response = await fetchWithTimeout(url, "HEAD");

      // Some servers block HEAD. Fall back to GET.
      if ([403, 405, 501].includes(response.status)) {
        response = await fetchWithTimeout(url, "GET");
      }
    } catch {
      response = await fetchWithTimeout(url, "GET");
    }

    const contentType = response.headers.get("content-type");
    const finalUrl = response.url || url;
    const ok = response.status >= 200 && response.status < 400;

    console.log(
      `  → ${ok ? "valid" : "failed"}: ${response.status} ${
        contentType || ""
      }`
    );

    return {
      id,
      rank,
      title,
      url,
      status: ok ? "valid" : "failed",
      http_status: response.status,
      content_type: contentType,
      final_url: finalUrl,
      validation_error: ok ? null : `HTTP ${response.status}`,
    };
  } catch (err: any) {
    const message =
      err?.name === "AbortError"
        ? `Timed out after ${TIMEOUT_MS / 1000}s`
        : err?.message || String(err);

    console.log(`  → failed: ${message}`);

    return {
      id,
      rank,
      title,
      url,
      status: "failed",
      http_status: null,
      content_type: null,
      final_url: null,
      validation_error: message,
    };
  }
}

async function writeReport(results: ValidationResult[]) {
  const summary = {
    total: results.length,
    valid: results.filter((r) => r.status === "valid").length,
    failed: results.filter((r) => r.status === "failed").length,
    unchecked: results.filter((r) => r.status === "unchecked").length,
  };

  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await fs.writeFile(
    REPORT_PATH,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        summary,
        results,
      },
      null,
      2
    )
  );
}

async function main() {
  const started = Date.now();
  const docs = await readManifest();
  const results: ValidationResult[] = [];

  console.log(`Loaded ${docs.length} manifest documents.`);
  console.log(`Validating with concurrency=${CONCURRENCY}, timeout=${TIMEOUT_MS}ms\n`);

  let nextIndex = 0;

  async function worker() {
    while (nextIndex < docs.length) {
      const index = nextIndex++;
      const result = await validateOne(docs[index], index, docs.length);
      results[index] = result;
      await writeReport(results.filter(Boolean));
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const finalResults = results.filter(Boolean);
  await writeReport(finalResults);

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  const valid = finalResults.filter((r) => r.status === "valid").length;
  const failed = finalResults.filter((r) => r.status === "failed").length;
  const unchecked = finalResults.filter((r) => r.status === "unchecked").length;

  console.log("\nValidation complete.");
  console.log(`Total: ${finalResults.length}`);
  console.log(`Valid: ${valid}`);
  console.log(`Failed: ${failed}`);
  console.log(`Unchecked: ${unchecked}`);
  console.log(`Elapsed: ${elapsed}s`);
  console.log(`Report: ${REPORT_PATH}`);
}

main().catch((err) => {
  console.error("Fatal validation error:", err);
  process.exit(1);
});
