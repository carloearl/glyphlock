import React from "react";

function PhotoSlot({ initials, size = "lg" }) {
  const dim = size === "lg" ? "w-32 h-32 sm:w-40 sm:h-40 text-4xl" : "w-24 h-24 text-2xl";
  return (
    <div
      className={`${dim} shrink-0 rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-500/20 to-indigo-500/10 flex items-center justify-center font-black text-blue-200`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

function Points({ items }) {
  return (
    <ul className="space-y-2 mt-4">
      {items.map((t) => (
        <li key={t} className="flex gap-3 text-blue-100/85 leading-relaxed">
          <span className="text-blue-400 mt-1">—</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export default function LeadershipTeam() {
  return (
    <section id="leadership" className="w-full max-w-6xl mb-16">
      <h2 className="text-3xl sm:text-4xl font-black text-white text-center mb-3">Leadership</h2>
      <p className="text-blue-300 text-center mb-10 max-w-2xl mx-auto">
        Three people, three defined responsibilities.
      </p>

      {/* Founder — full width */}
      <div
        className="rounded-3xl p-8 sm:p-10 mb-5"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.18) 0%, rgba(49, 46, 129, 0.12) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          backdropFilter: 'blur(16px)'
        }}
      >
        <div className="flex flex-col sm:flex-row gap-8">
          <PhotoSlot initials="CE" />
          <div className="min-w-0">
            <h3 className="text-2xl sm:text-3xl font-black text-white">Carlo René Earl</h3>
            <p className="text-blue-300 font-semibold mt-1">
              Founder, Owner, Chief Executive Officer and DACO
            </p>
            <Points
              items={[
                "Worked directly inside venue front-door, entertainer, and nightly-settlement operations, which is where the problem NUPS solves was identified.",
                "Designed the GlyphLock carrier, verification, and evidence-recordkeeping architecture and holds final authority over architecture and governance decisions.",
                "Leads intellectual-property direction, partner and integration outreach, and commercialization."
              ]}
            />
            <p className="mt-5 text-white font-semibold">
              Why it matters to NUPS: the product requirements come from someone who ran
              the shift, not from someone who interviewed people who did.
            </p>
          </div>
        </div>
      </div>

      {/* Two equal cards */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl p-8 border border-white/10 bg-white/[0.03] backdrop-blur-md">
          <div className="flex items-center gap-5">
            <PhotoSlot initials="CV" size="sm" />
            <div>
              <h3 className="text-xl font-bold text-white">Collin Vanderginst</h3>
              <p className="text-blue-300 font-semibold text-sm mt-1">Chief Technology Officer</p>
            </div>
          </div>
          <Points
            items={[
              "Hardware, networking, and surveillance deployment experience across multiple commercial sites in Arizona, including Jiffy Lube locations.",
              "Physical installation and distributed-security work: cameras, cabling, network segmentation, and on-site device reliability.",
              "Owns NUPS hardware integration — scanners, card readers, printers, terminals — and physical venue deployment."
            ]}
          />
          <p className="mt-5 text-white font-semibold">
            Why it matters to NUPS: a venue system fails at the hardware edge first, and
            Collin has installed and supported that edge in production environments.
          </p>
        </div>

        <div className="rounded-3xl p-8 border border-white/10 bg-white/[0.03] backdrop-blur-md">
          <div className="flex items-center gap-5">
            <PhotoSlot initials="JL" size="sm" />
            <div>
              <h3 className="text-xl font-bold text-white">Jacub Lough</h3>
              <p className="text-blue-300 font-semibold text-sm mt-1">
                Chief Security Officer and Chief Financial Officer
              </p>
            </div>
          </div>
          <Points
            items={[
              "Finance, risk, and commercial operating experience built through IceVault88.",
              "Security and risk oversight, including access control, operating discipline, and vendor and counterparty review.",
              "Owns financial controls, reporting structure, and commercialization discipline inside GlyphLock."
            ]}
          />
          <p className="mt-5 text-white font-semibold">
            Why it matters to NUPS: he brings the discipline required to turn product
            activity into an accountable business with books that hold up to review.
          </p>
        </div>
      </div>

      <p className="mt-6 text-xs text-blue-300/60 text-center">
        Titles reflect current roles. Collin and Jacub are executive officers, not cofounders.
      </p>
    </section>
  );
}