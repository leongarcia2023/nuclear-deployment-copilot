import fs from "node:fs/promises";
import path from "node:path";
import { readManifest } from "./document-script-utils";

type AnyRecord = Record<string, any>;

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function main() {
  const manifest = await readManifest();
  const validationRaw = await readJson<any>(path.join(process.cwd(), "data", "document_validation_report.json"), []);
  const validation = Array.isArray(validationRaw) ? validationRaw : validationRaw.results ?? [];
  const downloads = await readJson<AnyRecord[]>(path.join(process.cwd(), "data", "download_report.json"), []);
  const extractions = await readJson<AnyRecord[]>(path.join(process.cwd(), "data", "extraction_report.json"), []);
  const chunkReport = await readJson<AnyRecord>(path.join(process.cwd(), "data", "chunk_report.json"), { total_chunks: 0, chunks_by_document: {}, failures: [] });
  const chunkPath = path.join(process.cwd(), "corpus", "chunks", "document_chunks.jsonl");
  const chunkLines = (await fs.readFile(chunkPath, "utf8").catch(() => "")).split(/\r?\n/).filter(Boolean);
  const chunks = chunkLines.map((line) => JSON.parse(line));

  const chunksByDeploymentLayer: Record<string, number> = {};
  const chunksByDocumentFamily: Record<string, number> = {};
  for (const chunk of chunks) {
    for (const layer of chunk.deployment_layers ?? []) {
      chunksByDeploymentLayer[layer] = (chunksByDeploymentLayer[layer] ?? 0) + 1;
    }
    chunksByDocumentFamily[chunk.document_family] = (chunksByDocumentFamily[chunk.document_family] ?? 0) + 1;
  }

  const report = {
    generated_at: new Date().toISOString(),
    manifest_docs: manifest.length,
    top_25_docs: manifest.filter((document) => document.rank <= 25).length,
    validated: validation.filter((item: AnyRecord) => (item.status ?? item.url_status) === "valid").length,
    downloaded: downloads.filter((item) => item.status === "downloaded").length,
    extracted: extractions.filter((item) => item.status === "extracted" || item.status === "low_text_yield").length,
    low_text_yield: extractions.filter((item) => item.status === "low_text_yield").length,
    chunked: chunkReport.documents_chunked ?? Object.keys(chunkReport.chunks_by_document ?? {}).length,
    failed_downloads: downloads.filter((item) => item.status === "failed").length,
    failed_extractions: extractions.filter((item) => item.status === "failed").length,
    total_chunks: chunks.length || chunkReport.total_chunks || 0,
    chunks_by_deployment_layer: chunksByDeploymentLayer,
    chunks_by_document_family: chunksByDocumentFamily,
    chunks_by_document: chunkReport.chunks_by_document ?? {},
    chunk_failures: chunkReport.failures ?? [],
  };

  await fs.writeFile(path.join(process.cwd(), "data", "corpus_audit_report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(`manifest docs: ${report.manifest_docs}`);
  console.log(`top-25 docs: ${report.top_25_docs}`);
  console.log(`validated: ${report.validated}`);
  console.log(`downloaded: ${report.downloaded}`);
  console.log(`extracted: ${report.extracted}`);
  console.log(`low_text_yield: ${report.low_text_yield}`);
  console.log(`chunked: ${report.chunked}`);
  console.log(`failed downloads: ${report.failed_downloads}`);
  console.log(`failed extractions: ${report.failed_extractions}`);
  console.log(`total chunks: ${report.total_chunks}`);
  console.log(`chunks by deployment layer: ${JSON.stringify(report.chunks_by_deployment_layer)}`);
  console.log(`chunks by document family: ${JSON.stringify(report.chunks_by_document_family)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
