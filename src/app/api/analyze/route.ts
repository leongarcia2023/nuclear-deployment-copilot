import { NextResponse } from "next/server";
import demoProfile from "../../../../data/demo_project_profile.sample.json";
import type { ProjectCounterpartyProfile } from "@/types/core";

export async function POST() {
  return NextResponse.json({
    profile: demoProfile as ProjectCounterpartyProfile,
    generatedBy: "demo_fixture",
    llmCalls: false,
  });
}
