import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { argLimit, documentId, ensureCorpusDirs, inferExtension, readManifest } from "./document-script-utils";
import type { DocumentManifestItem } from "../src/lib/documents/documentTypes";

const execFileAsync = promisify(execFile);

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

const reportPath = path.join(process.cwd(), "data", "download_report.json");
const timeoutMs = 30_000;

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 NuclearDeploymentIntelligence/0.1 (+local document ingestion)",
        Accept: "application/pdf,text/html,application/xhtml+xml,text/plain,*/*;q=0.8",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function contentTypeFromHeaders(headers: string) {
  const matches = [...headers.matchAll(/^content-type:\s*(.+)$/gim)];
  return matches.at(-1)?.[1]?.trim() ?? "";
}

async function downloadWithCurl(url: string, tempPath: string) {
  const headerPath = `${tempPath}.headers`;
  try {
    await execFileAsync("curl", [
      "-L",
      "--fail",
      "--silent",
      "--show-error",
      "--max-time",
      "60",
      "-A",
      "Mozilla/5.0 NuclearDeploymentIntelligence/0.1 (+local document ingestion)",
      "-D",
      headerPath,
      "-o",
      tempPath,
      url,
    ], { maxBuffer: 1024 * 1024 * 2 });
    const headers = await fs.readFile(headerPath, "utf8").catch(() => "");
    return { contentType: contentTypeFromHeaders(headers), finalUrl: url };
  } finally {
    await fs.rm(headerPath, { force: true }).catch(() => undefined);
  }
}

async function downloadOne(document: DocumentManifestItem, index: number, total: number): Promise<DownloadReportItem> {
  const id = documentId(document);
  const tempPath = path.join(process.cwd(), "corpus", "raw", `${id}.download`);
  console.log(`[${index + 1}/${total}] downloading ${document.title}`);

  try {
    let contentType = "";
    let sourceUrl = document.url;

    try {
      const response = await fetchWithTimeout(document.url);
      contentType = response.headers.get("content-type") ?? "";
      sourceUrl = response.url || document.url;
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(tempPath, bytes);
    } catch (fetchError) {
      const curlResult = await downloadWithCurl(document.url, tempPath);
      contentType = curlResult.contentType;
      sourceUrl = curlResult.finalUrl;
      if (!contentType) {
        console.warn("  warning: curl did not return a content-type header; inferring from URL");
      }
    }

    const extension = inferExtension(sourceUrl, contentType);
    if (!contentType.toLowerCase().includes("pdf") && !contentType.toLowerCase().includes("html") && extension !== ".pdf" && extension !== ".html") {
      console.warn(`  warning: unexpected content-type ${contentType || "unknown"}; saving as ${extension}`);
    }

    const relativePath = path.join("corpus", "raw", `${id}${extension}`);
    const absolutePath = path.join(process.cwd(), relativePath);
    await fs.rename(tempPath, absolutePath);
    console.log(`  → downloaded ${relativePath}`);

    return {
      document_id: id,
      rank: document.rank,
      title: document.title,
      url: document.url,
      content_type: contentType,
      local_raw_path: relativePath,
      status: "downloaded",
      error: "",
    };
  } catch (error) {
    await fs.rm(tempPath, { force: true }).catch(() => undefined);
    const message = error instanceof Error ? error.message : String(error);
    console.log(`  → failed ${message}`);
    return {
      document_id: id,
      rank: document.rank,
      title: document.title,
      url: document.url,
      content_type: "",
      local_raw_path: "",
      status: "failed",
      error: message,
    };
  }
}

async function main() {
  const limit = argLimit(25);
  await ensureCorpusDirs();
  const documents = (await readManifest()).filter((document) => document.rank <= limit).slice(0, limit);
  const report: DownloadReportItem[] = [];

  for (let index = 0; index < documents.length; index += 1) {
    report.push(await downloadOne(documents[index], index, documents.length));
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
  }

  const downloaded = report.filter((item) => item.status === "downloaded").length;
  const failed = report.filter((item) => item.status === "failed").length;
  console.log(`Done. downloaded=${downloaded} failed=${failed}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
