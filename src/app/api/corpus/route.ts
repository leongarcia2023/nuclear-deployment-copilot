import { NextRequest, NextResponse } from "next/server";
import { loadCorpusChunks, searchCorpus } from "@/lib/corpus/searchCorpus";
import { sourceCategories } from "@/lib/corpus/sourceTypes";
import type { RelevanceModule, SourceCategory } from "@/lib/corpus/sourceTypes";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q")?.trim() ?? "";
  const tag = searchParams.get("tag")?.trim() ?? "";
  const module = searchParams.get("module")?.trim() as RelevanceModule | "";
  const category = searchParams.get("category")?.trim() as SourceCategory | "";

  const allChunks = await loadCorpusChunks();
  const chunks = await searchCorpus({
    query,
    tags: tag ? [tag] : [],
    sourceCategories: category ? [category] : [],
    relevanceModules: module ? [module] : [],
    limit: query || tag || category || module ? 24 : 60,
  });

  const tags = Array.from(new Set(allChunks.flatMap((chunk) => chunk.topic_tags))).sort();
  const relevanceModules = Array.from(new Set(allChunks.flatMap((chunk) => chunk.relevance_modules))).sort();
  const availableSourceCategories = Array.from(new Set([...sourceCategories, ...allChunks.map((chunk) => chunk.source_category)])).sort();

  return NextResponse.json({ chunks, tags, sourceCategories: availableSourceCategories, relevanceModules, total: chunks.length });
}
