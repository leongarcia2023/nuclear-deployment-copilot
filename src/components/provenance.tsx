import type { EvidenceStatus, ReadinessBand } from "@/types/core";

const statusLabels: Record<EvidenceStatus, string> = {
  public_source_verified: "Public source",
  sanitized_user_note: "User note",
  uploaded_document_claimed: "Uploaded claim",
  internal_source_verified: "Internal verified",
  inferred: "Inferred",
  missing: "Missing",
  unknowable_from_public_docs: "Cannot know from public docs",
};

const bandLabels: Record<ReadinessBand, string> = {
  credible: "Credible",
  conditional: "Conditional",
  speculative: "Speculative",
  not_ready: "Not ready",
};

export function statusLabel(status: EvidenceStatus) {
  return statusLabels[status];
}

export function bandLabel(band: ReadinessBand) {
  return bandLabels[band];
}

export function EvidenceBadge({ status }: { status: EvidenceStatus }) {
  return (
    <span className={`evidence-${status} inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]`}>
      {statusLabels[status]}
    </span>
  );
}

export function BandBadge({ band }: { band: ReadinessBand }) {
  const tone =
    band === "credible"
      ? "border-emerald-800/25 bg-emerald-800/10 text-emerald-900"
      : band === "conditional"
        ? "border-amber-800/25 bg-amber-800/10 text-amber-900"
        : band === "speculative"
          ? "border-orange-800/25 bg-orange-800/10 text-orange-900"
          : "border-red-800/25 bg-red-800/10 text-red-900";

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${tone}`}>{bandLabels[band]}</span>;
}

export function SectionShell({ title, kicker, children }: { title: string; kicker?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[#d9d3c8] py-8">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {kicker ? <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b5b25]">{kicker}</p> : null}
          <h2 className="text-2xl font-semibold text-[#151514]">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}
