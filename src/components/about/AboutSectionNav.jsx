const sections = [
  ["Origin", "#origin"],
  ["Architecture", "#architecture"],
  ["Technical systems", "#technical-systems"],
  ["Scenarios", "#scenarios"],
  ["NUPS proof", "#nups-proof"],
  ["Technology record", "#technology-record"],
  ["Maturity", "#maturity"],
  ["Leadership", "#leadership"],
];

export default function AboutSectionNav() {
  return (
    <nav aria-label="About page sections" className="sticky top-0 z-40 border-y border-white/10 bg-[#05070b]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3 sm:px-8 lg:px-12">
        {sections.map(([label, href]) => (
          <a key={href} href={href} className="shrink-0 rounded-full border border-transparent px-3 py-2 text-xs font-bold text-slate-400 transition hover:border-white/10 hover:bg-white/5 hover:text-white">
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}
