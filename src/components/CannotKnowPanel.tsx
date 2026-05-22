export function CannotKnowPanel({ items }: { items: string[] }) {
  return (
    <section className="border border-[#d9d3c8] bg-[#fbfaf7] p-6">
      <h2 className="text-2xl font-semibold">What this tool cannot know from public documents</h2>
      <p className="mt-3 max-w-3xl text-base leading-7 text-[#4a4842]">
        These should remain unresolved unless the counterparty provides permissioned, sanitized evidence or the facts become public.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="border border-[#d9d3c8] bg-white px-4 py-3 text-base leading-7 text-[#292824]">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
