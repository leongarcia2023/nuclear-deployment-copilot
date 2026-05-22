import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SourceLibraryClient } from "@/components/SourceLibraryClient";
import { loadDocumentManifest } from "@/lib/documents/loadDocumentManifest";

export default function CorpusPage() {
  const documents = loadDocumentManifest();

  return (
    <main className="min-h-screen bg-[#f4f1ea] px-5 py-8 text-[#151514] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-8 flex items-center justify-between gap-4">
          <Link className="inline-flex items-center gap-2 text-base font-semibold text-[#151514]" href="/">
            <ArrowLeft className="h-4 w-4" />
            Deal Diligence
          </Link>
          <div className="flex gap-5 text-base text-[#63615b]">
            <Link className="hover:text-[#151514]" href="/corpus">Source Library</Link>
            <Link className="hover:text-[#151514]" href="/methodology">Methodology</Link>
          </div>
        </nav>
        <SourceLibraryClient documents={documents} />
      </div>
    </main>
  );
}
