import fs from "node:fs/promises";
import path from "node:path";
import { documentId, normalizeWhitespace, readManifest } from "./document-script-utils";

type ExtractionReportItem = {
  document_id: string;
  rank: number;
  title: string;
  local_raw_path: string;
  local_text_path: string;
  status: "extracted" | "failed" | "low_text_yield";
  character_count: number;
  error: string;
};

type ChunkReport = {
  documents_chunked: number;
  total_chunks: number;
  chunks_by_document: Record<string, number>;
  failures: Array<{ document_id: string; rank: number; title: string; error: string }>;
};

const extractionReportPath = path.join(process.cwd(), "data", "extraction_report.json");
const chunksPath = path.join(process.cwd(), "corpus", "chunks", "document_chunks.jsonl");
const chunkReportPath = path.join(process.cwd(), "data", "chunk_report.json");
const targetWords = 700;
const overlapWords = 100;

function chunkWords(words: string[]) {
  const chunks: string[][] = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + targetWords, words.length);
    const chunk = words.slice(start, end);
    if (chunk.length > 0) chunks.push(chunk);
    if (end >= words.length) break;
    start = Math.max(0, end - overlapWords);
  }
  return chunks;
}

async function main() {
  await fs.mkdir(path.dirname(chunksPath), { recursive: true });
  const manifest = await readManifest();
  const extractionReport = JSON.parse(await fs.readFile(extractionReportPath, "utf8")) as ExtractionReportItem[];
  const lines: string[] = [];
  const report: ChunkReport = { documents_chunked: 0, total_chunks: 0, chunks_by_document: {}, failures: [] };

  for (const item of extractionReport) {
    if (item.status === "failed") continue;
    const document = manifest.find((candidate) => candidate.rank === item.rank);
    if (!document) {
      report.failures.push({ document_id: item.document_id, rank: item.rank, title: item.title, error: "Manifest record not found" });
      continue;
    }

    try {
      const text = normalizeWhitespace(await fs.readFile(path.join(process.cwd(), item.local_text_path), "utf8"));
      const words = text.split(/\s+/).filter(Boolean);
      const chunks = chunkWords(words);
      const id = documentId(document);

      chunks.forEach((chunk, chunkIndex) => {
        const chunkText = chunk.join(" ").trim();
        if (!chunkText) return;
        const record = {
          chunk_id: `${id}_chunk_${String(chunkIndex).padStart(4, "0")}`,
          document_id: id,
          rank: document.rank,
          title: document.title,
          source_url: document.url,
          document_family: document.document_family,
          deployment_layers: document.deployment_layers,
          memo_sections_supported: document.memo_sections_supported,
          benchmark_value: document.benchmark_value,
          chunk_index: chunkIndex,
          text: chunkText,
          word_count: chunk.length,
          token_estimate: Math.ceil(chunk.length * 1.33),
        };
        lines.push(JSON.stringify(record));
      });

      if (chunks.length > 0) {
        report.documents_chunked += 1;
        report.chunks_by_document[id] = chunks.length;
        report.total_chunks += chunks.length;
      }
    } catch (error) {
      report.failures.push({ document_id: item.document_id, rank: item.rank, title: item.title, error: error instanceof Error ? error.message : String(error) });
    }
  }

  await fs.writeFile(chunksPath, lines.join("\n") + (lines.length ? "\n" : ""));
  await fs.writeFile(chunkReportPath, JSON.stringify(report, null, 2) + "\n");
  console.log(`Done. documents_chunked=${report.documents_chunked} total_chunks=${report.total_chunks} failures=${report.failures.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
