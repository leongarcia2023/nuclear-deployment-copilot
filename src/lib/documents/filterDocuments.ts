import type { DocumentManifestItem, UrlStatus } from "./documentTypes";

export interface DocumentFilters {
  query?: string;
  includedIn?: string;
  deploymentLayer?: string;
  documentFamily?: string;
  benchmarkValue?: string;
  urlStatus?: UrlStatus | "";
}

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function includes(value: string, query: string) {
  return normalize(value).includes(normalize(query));
}

export function filterDocuments(documents: DocumentManifestItem[], filters: DocumentFilters) {
  return documents.filter((document) => {
    const searchText = [
      document.title,
      document.url,
      document.adams_accession ?? "",
      document.document_family,
      document.why_it_matters,
      document.suggested_chunking_strategy,
      ...document.deployment_layers,
      ...document.memo_sections_supported,
      ...document.included_in,
    ].join(" ");

    return (
      (!filters.query || includes(searchText, filters.query)) &&
      (!filters.includedIn || document.included_in.includes(filters.includedIn)) &&
      (!filters.deploymentLayer || document.deployment_layers.includes(filters.deploymentLayer)) &&
      (!filters.documentFamily || document.document_family === filters.documentFamily) &&
      (!filters.benchmarkValue || document.benchmark_value === filters.benchmarkValue) &&
      (!filters.urlStatus || (document.url_status ?? "unchecked") === filters.urlStatus)
    );
  });
}
