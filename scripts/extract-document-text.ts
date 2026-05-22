import fs from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
import { PDFParse } from "pdf-parse";
import { documentId, ensureCorpusDirs, normalizeWhitespace, readManifest } from "./document-script-utils";

type DownloadReportItem = {
  document_id: string;
  rank: number;
  title: string;
  url: string;
  content_type: string;
  local_raw_path: string;
  status: "downloaded" | "failed";
  error: string;
};

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

const downloadReportPath = path.join(process.cwd(), "data", "download_report.json");
const extractionReportPath = path.join(process.cwd(), "data", "extraction_report.json");

async function extractPdf(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return normalizeWhitespace(result.text ?? "");
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

function extractHtml(html: string) {
  const $ = load(html);
  $("script, style, noscript, svg, nav, footer, header").remove();
  const title = $("title").first().text();
  const mainText = $("main").text() || $("article").text() || $("body").text();
  return normalizeWhitespace([title, mainText].filter(Boolean).join("\n\n"));
}

async function extractOne(item: DownloadReportItem): Promise<ExtractionReportItem> {
  const relativeTextPath = path.join("corpus", "text", `${item.document_id}.txt`);
  const absoluteTextPath = path.join(process.cwd(), relativeTextPath);

  try {
    if (item.status !== "downloaded" || !item.local_raw_path) throw new Error(item.error || "Document was not downloaded");
    const absoluteRawPath = path.join(process.cwd(), item.local_raw_path);
    const buffer = await fs.readFile(absoluteRawPath);
    const lowerPath = item.local_raw_path.toLowerCase();
    const lowerType = item.content_type.toLowerCase();
    let text = "";

    if (lowerPath.endsWith(".pdf") || lowerType.includes("application/pdf")) {
      text = await extractPdf(buffer);
    } else if (lowerPath.endsWith(".html") || lowerPath.endsWith(".htm") || lowerType.includes("html")) {
      text = extractHtml(buffer.toString("utf8"));
    } else {
      text = normalizeWhitespace(buffer.toString("utf8"));
    }

    await fs.writeFile(absoluteTextPath, text + "\n");
    const status = text.length < 1000 ? "low_text_yield" : "extracted";
    console.log(`${status === "extracted" ? "extracted" : "low text"}: ${item.title} (${text.length} chars)`);
    return {
      document_id: item.document_id,
      rank: item.rank,
      title: item.title,
      local_raw_path: item.local_raw_path,
      local_text_path: relativeTextPath,
      status,
      character_count: text.length,
      error: "",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`failed extraction: ${item.title} - ${message}`);
    return {
      document_id: item.document_id,
      rank: item.rank,
      title: item.title,
      local_raw_path: item.local_raw_path,
      local_text_path: relativeTextPath,
      status: "failed",
      character_count: 0,
      error: message,
    };
  }
}

async function main() {
  await ensureCorpusDirs();
  const manifest = await readManifest();
  const downloads = JSON.parse(await fs.readFile(downloadReportPath, "utf8")) as DownloadReportItem[];
  const report: ExtractionReportItem[] = [];

  for (const item of downloads) {
    const manifestItem = manifest.find((document) => document.rank === item.rank);
    const normalizedItem = manifestItem ? { ...item, document_id: documentId(manifestItem), title: manifestItem.title } : item;
    report.push(await extractOne(normalizedItem));
    await fs.writeFile(extractionReportPath, JSON.stringify(report, null, 2) + "\n");
  }

  const extracted = report.filter((item) => item.status === "extracted").length;
  const low = report.filter((item) => item.status === "low_text_yield").length;
  const failed = report.filter((item) => item.status === "failed").length;
  console.log(`Done. extracted=${extracted} low_text_yield=${low} failed=${failed}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
