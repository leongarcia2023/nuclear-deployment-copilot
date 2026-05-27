import { SiteNav } from "@/components/SiteNav";

const layers = [
  {
    layer: "Licensing / NRC",
    why: "A deployment date is not credible unless the applicant, licensing path, docket posture, and regulatory milestones can support it.",
    evidence: "Public NRC docket materials, pre-application records, application status, review schedule, open issue tracker, and named licensing owner.",
    private: "Internal NRC feedback, unresolved staff concerns, management readiness, and non-public licensing strategy can remain unknowable from public documents.",
  },
  {
    layer: "Fuel supply / HALEU",
    why: "Advanced reactor timelines can fail if fuel assay, quantity, allocation, and delivery windows are not executable.",
    evidence: "Assay, form, first-core and reload quantities, supplier allocation or reservation, delivery schedule, and fallback plan.",
    private: "Private supply agreements, allocation priority, pricing, credit support, and supplier capacity are usually private diligence items.",
  },
  {
    layer: "Fuel fabrication",
    why: "Enrichment is not enough; fuel must be fabricated, qualified, licensed, and delivered through a real facility path.",
    evidence: "Named fabrication facility, licensing status, qualification plan, interface control documents, and capacity reservation.",
    private: "Detailed manufacturing readiness, confidential vendor terms, and capacity conflicts may not be public.",
  },
  {
    layer: "Transportation / safeguards",
    why: "Nuclear material movement and security can create schedule and responsibility constraints.",
    evidence: "Package basis, logistics owner, safeguards category, storage plan, material-control responsibilities, and responsible licensee mapping.",
    private: "Routes, detailed security plans, safeguards procedures, and transport contracts are often non-public.",
  },
  {
    layer: "Site / permitting",
    why: "A reactor or power campus is not deployable without rights to a suitable site and a credible local permitting path.",
    evidence: "Site control, land rights, permit matrix, environmental constraints, local approvals, water/access assumptions, and community record.",
    private: "Land-option terms, political risks, local stakeholder posture, and permitting contingencies may require private diligence.",
  },
  {
    layer: "Power delivery / interconnection",
    why: "Delivered power depends on how electrons actually reach the customer or grid, not just reactor output.",
    evidence: "Interconnection queue position, islanded or behind-the-meter operating basis, substation/transmission scope, load study, and energization milestones.",
    private: "Utility negotiations, queue strategy, confidential studies, and customer-specific power delivery terms can remain private.",
  },
  {
    layer: "Bridge power / phased energization",
    why: "Data center and industrial customers may need near-term power before nuclear is available.",
    evidence: "Initial power source, term, cost, permits, emissions exposure, reliability obligations, and transition plan to permanent supply.",
    private: "Bridge-power economics, fuel contracts, operating obligations, and downside exposure may not be public.",
  },
  {
    layer: "EPC / construction",
    why: "Construction responsibility, cost, schedule, and performance security determine whether a project is financeable.",
    evidence: "EPC scope, contractor identity, cost basis, schedule, contingency, procurement plan, and risk allocation.",
    private: "Bid quality, contractor negotiations, incentives, delay damages, and cost-overrun ownership are usually private.",
  },
  {
    layer: "Offtake / customer",
    why: "Customer demand must be binding or otherwise financeable for commercial claims to matter.",
    evidence: "Executed or near-executed offtake, credit support, pricing framework, termination rights, load ramp, and customer decision authority.",
    private: "Pricing, termination rights, credit terms, side letters, and real customer appetite often cannot be verified from public documents.",
  },
  {
    layer: "Financing",
    why: "Capital must match the project's maturity and risk allocation, not just the ambition of the announcement.",
    evidence: "Sources and uses, committed equity/debt, DOE LPO or grant status if claimed, milestone conditions, and downside case.",
    private: "Investment committee posture, lender feedback, covenant terms, and internal return thresholds are private diligence items.",
  },
  {
    layer: "Operations / waste",
    why: "Operating model, staffing, security, maintenance, spent fuel, and waste responsibilities affect long-term deliverability.",
    evidence: "Operator plan, staffing model, maintenance scope, security model, spent fuel handling, waste plan, and long-term responsibility.",
    private: "Detailed operating procedures, staffing weaknesses, security arrangements, and waste-contract terms may remain non-public.",
  },
];

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#151514]">
      <SiteNav />
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <header className="mb-8 border border-[#d9d3c8] bg-[#fbfaf7] p-8">
          <p className="text-base font-semibold text-[#7b5b25]">Methodology</p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight">Deployment Risk Framework</h1>
          <p className="mt-4 max-w-3xl text-xl leading-8 text-[#3f3d38]">
            Nuclear deployment claims are evaluated across the layers required to turn a reactor concept into delivered power.
          </p>
        </header>


        <section className="mb-8 grid gap-4 md:grid-cols-2">
          <article className="border border-[#d9d3c8] bg-[#fbfaf7] p-6">
            <h2 className="text-2xl font-semibold">Why not just ChatGPT?</h2>
            <ul className="mt-4 space-y-2 text-base leading-7 text-[#4a4842]">
              <li>Generic ChatGPT gives a fluent opinion.</li>
              <li>This system forces every claim through a nuclear deployment evidence framework.</li>
              <li>It separates corpus coverage from target-specific support.</li>
              <li>It flags missing/private evidence.</li>
              <li>It retrieves relevant public source context.</li>
              <li>It generates diligence questions and a reusable first-pass memo.</li>
              <li>It runs without paid AI API calls in this version.</li>
            </ul>
          </article>
          <article className="border border-[#d9d3c8] bg-[#fbfaf7] p-6">
            <h2 className="text-2xl font-semibold">Deployment note</h2>
            <p className="mt-4 text-base leading-7 text-[#4a4842]">
              This version runs deterministic source-grounded analysis without paid AI API calls.
            </p>
          </article>
        </section>
        <section className="space-y-4">
          {layers.map((item, index) => (
            <article key={item.layer} className="border border-[#d9d3c8] bg-[#fbfaf7] p-5">
              <div className="flex items-start gap-4">
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center border border-[#bfb6a7] bg-white text-base font-semibold">
                  {index + 1}
                </span>
                <div>
                  <h2 className="text-2xl font-semibold">{item.layer}</h2>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <p className="text-base leading-7 text-[#4a4842]"><span className="font-semibold text-[#151514]">Why it matters:</span> {item.why}</p>
                    <p className="text-base leading-7 text-[#4a4842]"><span className="font-semibold text-[#151514]">Supporting evidence:</span> {item.evidence}</p>
                    <p className="text-base leading-7 text-[#63615b]"><span className="font-semibold text-[#151514]">Private or unknowable:</span> {item.private}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
