import { SiteNav } from "@/components/SiteNav";
import { SourceLibraryClient } from "@/components/SourceLibraryClient";
import { loadDocumentManifest } from "@/lib/documents/loadDocumentManifest";

export default function CorpusPage() {
  const documents = loadDocumentManifest();

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#151514]">
      <SiteNav />
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <SourceLibraryClient documents={documents} />
      </div>
    </main>
  );
}
