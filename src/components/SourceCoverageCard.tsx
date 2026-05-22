import type { MemoSourceCoverage } from "@/types/core";

const defaultCoverage: MemoSourceCoverage = [
  { id: "licensing_path", layer: "Licensing / NRC", status: "missing", note: "No public licensing evidence loaded for this claim." },
  { id: "fuel_supply_haleu", layer: "Fuel supply / HALEU", status: "missing", note: "No public HALEU supply evidence loaded for this claim." },
  { id: "fuel_fabrication", layer: "Fuel fabrication", status: "missing", note: "No fabrication evidence loaded for this claim." },
  { id: "transportation_safeguards_storage", layer: "Transportation / safeguards", status: "missing", note: "No transport or safeguards evidence loaded for this claim." },
  { id: "site_permitting", layer: "Site / permitting", status: "missing", note: "No site or permitting evidence loaded for this claim." },
  { id: "interconnection_power_delivery", layer: "Interconnection / power delivery", status: "missing", note: "No interconnection evidence loaded for this claim." },
  { id: "bridge_power_phased_energization", layer: "Bridge power / phased energization", status: "missing", note: "No bridge-power or phased energization evidence loaded for this claim." },
  { id: "epc_construction", layer: "EPC / construction", status: "private diligence required", note: "EPC bid quality and responsibility usually require private diligence." },
  { id: "commercial_offtake", layer: "Offtake / customer", status: "private diligence required", note: "Binding customer/offtake terms usually require private diligence." },
  { id: "financing", layer: "Financing", status: "private diligence required", note: "Financing commitments usually require private diligence." },
  { id: "operations_waste", layer: "Operations / waste", status: "missing", note: "No operations or waste evidence loaded for this claim." },
];

function label(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function tone(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === "covered") return "border-[#6d8f66] text-[#2f5d35]";
  if (normalized === "partial") return "border-[#b9924f] text-[#7b5b25]";
  if (normalized === "private diligence required") return "border-[#8b8174] text-[#4a4842]";
  if (normalized === "cannot know from public docs") return "border-[#8b8174] text-[#4a4842]";
  return "border-[#b9a6a0] text-[#9a3e33]";
}

export function SourceCoverageCard({ coverage }: { coverage?: MemoSourceCoverage }) {
  const rows = coverage?.length ? coverage : defaultCoverage;

  return (
    <section className="mt-6 border border-[#d9d3c8] bg-[#fbfaf7] p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-base font-semibold text-[#7b5b25]">Evidence coverage by deployment layer</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#151514]">Public-source support in the seed corpus</h2>
        </div>
        <p className="max-w-md text-base leading-7 text-[#63615b]">Current public evidence does or does not support the deployment claim across these layers. Coverage is not proof of deployability.</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {rows.map((row) => (
          <div key={row.id} className="border border-[#d9d3c8] bg-white p-4">
            <p className="text-base font-semibold leading-6 text-[#3f3d38]">{row.layer}</p>
            <p className={`mt-3 inline-flex border px-2.5 py-1 text-sm font-semibold ${tone(row.status)}`}>{label(row.status)}</p>
            <p className="mt-3 text-sm leading-6 text-[#63615b]">{row.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
