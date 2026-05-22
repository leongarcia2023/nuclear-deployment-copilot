"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { filterDocuments } from "@/lib/documents/filterDocuments";
import type { DocumentManifestItem, UrlStatus } from "@/lib/documents/documentTypes";

const includedInOptions = [
  "top_25_one_day_prototype",
  "top_75_credible_mvp",
  "top_150_robust_source_grounded_prototype",
];
const validationOptions: Array<UrlStatus | ""> = ["", "valid", "failed", "unchecked"];

function displayUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, "") + url.pathname;
  } catch {
    return value;
  }
}

export function SourceLibraryClient({ documents }: { documents: DocumentManifestItem[] }) {
  const [query, setQuery] = useState("");
  const [includedIn, setIncludedIn] = useState("");
  const [deploymentLayer, setDeploymentLayer] = useState("");
  const [documentFamily, setDocumentFamily] = useState("");
  const [benchmarkValue, setBenchmarkValue] = useState("");
  const [urlStatus, setUrlStatus] = useState<UrlStatus | "">("");

  const deploymentLayers = useMemo(() => Array.from(new Set(documents.flatMap((document) => document.deployment_layers))).sort(), [documents]);
  const documentFamilies = useMemo(() => Array.from(new Set(documents.map((document) => document.document_family))).sort(), [documents]);
  const filteredDocuments = useMemo(
    () => filterDocuments(documents, { query, includedIn, deploymentLayer, documentFamily, benchmarkValue, urlStatus }),
    [benchmarkValue, deploymentLayer, documentFamily, documents, includedIn, query, urlStatus],
  );

  return (
    <>
      <section className="mt-8 border border-[#d9d3c8] bg-[#fbfaf7] p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b5b25]">Source Library</p>
        <h1 className="mt-2 text-4xl font-semibold">Ranked source manifest</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[#63615b]">
          A 150-document public-source ingest plan for source-grounded nuclear deployment diligence. These are manifest records, not full-text chunks yet.
        </p>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_0.4fr_0.4fr]">
          <label className="flex items-center border border-[#bfb6a7] bg-[#f4f1ea] px-3 focus-within:border-[#151514]">
            <Search className="h-5 w-5 text-[#63615b]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search: HALEU, Amazon, FERC, construction permit..."
              className="w-full bg-transparent px-3 py-3 text-base outline-none"
            />
          </label>
          <select value={includedIn} onChange={(event) => setIncludedIn(event.target.value)} className="border border-[#bfb6a7] bg-[#f4f1ea] px-3 py-3 text-base outline-none focus:border-[#151514]">
            <option value="">All ingest tiers</option>
            {includedInOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={deploymentLayer} onChange={(event) => setDeploymentLayer(event.target.value)} className="border border-[#bfb6a7] bg-[#f4f1ea] px-3 py-3 text-base outline-none focus:border-[#151514]">
            <option value="">All deployment layers</option>
            {deploymentLayers.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <select value={documentFamily} onChange={(event) => setDocumentFamily(event.target.value)} className="border border-[#bfb6a7] bg-[#f4f1ea] px-3 py-3 text-base outline-none focus:border-[#151514]">
            <option value="">All document families</option>
            {documentFamilies.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={benchmarkValue} onChange={(event) => setBenchmarkValue(event.target.value)} className="border border-[#bfb6a7] bg-[#f4f1ea] px-3 py-3 text-base outline-none focus:border-[#151514]">
            <option value="">All benchmark values</option>
            <option value="strong">strong</option>
            <option value="moderate">moderate</option>
            <option value="weak">weak</option>
          </select>
          <select value={urlStatus} onChange={(event) => setUrlStatus(event.target.value as UrlStatus | "")} className="border border-[#bfb6a7] bg-[#f4f1ea] px-3 py-3 text-base outline-none focus:border-[#151514]">
            <option value="">All validation states</option>
            {validationOptions.filter(Boolean).map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <p className="mt-4 text-base leading-7 text-[#63615b]">Showing {filteredDocuments.length} of {documents.length} manifest documents.</p>
      </section>

      <section className="mt-6 grid gap-4">
        {filteredDocuments.map((document) => (
          <article key={document.rank} className="border border-[#d9d3c8] bg-[#fbfaf7] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-mono text-xs font-bold text-[#63615b]">Rank #{document.rank} · {document.document_family}</p>
                <h2 className="mt-2 text-xl font-semibold">{document.title}</h2>
                <a className="mt-2 inline-block text-base font-semibold text-[#255d82] underline-offset-4 hover:underline" href={document.url}>Open document</a>
                <p className="mt-1 break-all text-sm leading-6 text-[#63615b]">{displayUrl(document.url)}</p>
                {document.adams_accession ? <p className="mt-1 text-sm leading-6 text-[#63615b]">ADAMS: {document.adams_accession}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <span className="border border-[#b9924f] px-2.5 py-1 text-sm font-semibold text-[#7b5b25]">{document.benchmark_value}</span>
                <span className="border border-[#bfb6a7] px-2.5 py-1 text-sm font-semibold text-[#4a4842]">{document.url_status ?? "unchecked"}</span>
              </div>
            </div>
            <p className="mt-4 max-w-4xl text-base leading-7 text-[#4a4842]"><span className="font-semibold">Why it matters:</span> {document.why_it_matters}</p>
            <p className="mt-2 max-w-4xl text-base leading-7 text-[#4a4842]"><span className="font-semibold">Memo sections:</span> {document.memo_sections_supported.join(", ")}</p>
            <p className="mt-2 max-w-4xl text-base leading-7 text-[#63615b]"><span className="font-semibold">Chunking:</span> {document.suggested_chunking_strategy}</p>
            {document.validation_error ? <p className="mt-2 max-w-4xl text-base leading-7 text-[#9a3e33]">Validation: {document.validation_error}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {document.deployment_layers.map((item) => (
                <span key={`${document.rank}-${item}`} className="border border-[#bfb6a7] bg-[#f4f1ea] px-2.5 py-1 text-xs font-bold text-[#3f3d38]">{item}</span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
