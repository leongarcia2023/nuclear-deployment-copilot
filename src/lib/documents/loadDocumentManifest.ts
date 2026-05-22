import fs from "node:fs";
import path from "node:path";
import type { DocumentManifestItem, DocumentValidationRecord } from "./documentTypes";

const manifestPath = path.join(process.cwd(), "data", "nuclear_deployment_ranked_ingest_plan_150.jsonl");
const validationPath = path.join(process.cwd(), "data", "document_validation_report.json");

function readValidationReport(): Map<string, DocumentValidationRecord> {
  if (!fs.existsSync(validationPath)) return new Map();
  try {
    const records = JSON.parse(fs.readFileSync(validationPath, "utf8")) as DocumentValidationRecord[];
    return new Map(records.map((record) => [record.url, record]));
  } catch {
    return new Map();
  }
}

export function loadDocumentManifest(): DocumentManifestItem[] {
  if (!fs.existsSync(manifestPath)) return [];

  const validation = readValidationReport();
  return fs
    .readFileSync(manifestPath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as DocumentManifestItem)
    .sort((a, b) => a.rank - b.rank)
    .map((document) => {
      const record = validation.get(document.url);
      return {
        ...document,
        url_status: record?.url_status ?? "unchecked",
        http_status: record?.http_status ?? null,
        content_type: record?.content_type ?? "",
        validation_error: record?.validation_error ?? "",
      };
    });
}
