import fs from "node:fs/promises";
import path from "node:path";
import type { DocumentManifestItem } from "../src/lib/documents/documentTypes";

export const manifestPath = path.join(process.cwd(), "data", "nuclear_deployment_ranked_ingest_plan_150.jsonl");

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 70) || "document";
}

export function documentId(document: Pick<DocumentManifestItem, "rank" | "title">) {
  return `rank_${String(document.rank).padStart(3, "0")}_${slugify(document.title)}`;
}

export async function readManifest() {
  const raw = await fs.readFile(manifestPath, "utf8");
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line) as DocumentManifestItem;
      } catch {
        throw new Error(`Invalid JSONL at line ${index + 1}`);
      }
    })
    .sort((a, b) => a.rank - b.rank);
}

export function argLimit(defaultLimit: number) {
  const index = process.argv.indexOf("--limit");
  if (index === -1) return defaultLimit;
  const value = Number(process.argv[index + 1]);
  return Number.isFinite(value) && value > 0 ? value : defaultLimit;
}

export async function ensureCorpusDirs() {
  await fs.mkdir(path.join(process.cwd(), "corpus", "raw"), { recursive: true });
  await fs.mkdir(path.join(process.cwd(), "corpus", "text"), { recursive: true });
  await fs.mkdir(path.join(process.cwd(), "corpus", "chunks"), { recursive: true });
}

export function inferExtension(url: string, contentType: string) {
  const lowerType = contentType.toLowerCase();
  const pathname = (() => {
    try {
      return new URL(url).pathname.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  })();

  if (lowerType.includes("application/pdf") || pathname.endsWith(".pdf")) return ".pdf";
  if (lowerType.includes("text/html") || lowerType.includes("application/xhtml") || pathname.endsWith(".html") || pathname.endsWith(".htm")) return ".html";
  if (lowerType.includes("text/plain") || pathname.endsWith(".txt")) return ".txt";
  return pathname.endsWith(".pdf") ? ".pdf" : ".html";
}

export function normalizeWhitespace(value: string) {
  return value.replace(/\r/g, "\n").replace(/[\t ]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
