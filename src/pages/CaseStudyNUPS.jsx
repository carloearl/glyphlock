export default function CaseStudyNUPS() {
  const comparisonRows = [
    {
      capability: "Transaction Basis",
      legacy: "Trust based and merchant initiated",
      nups: "Consent based and customer executed",
    },
    {
      capability: "Evidence Type",
      legacy: "Static ID photo or signature",
      nups: "Dynamic clickwrap video and biometric ledger",
    },
    {
      capability: "Legal Standing",
      legacy: "Payment processor rules",
      nups: "Contract automation and governance bound workflow",
    },
    {
      capability: "Liability Handling",
      legacy: "Reactive chargeback defense",
      nups: "Proactive liability tracking through GlyphBucks",
    },
    {
      capability: "Audit Trail",
      legacy: "Internal database records",
      nups: "Immutable blockchain anchored record",
    },
  ];

  const misreads = [
    {
      title: "Security was framed as friction",
      body: "Verification steps were incorrectly labeled as burden instead of recognizing them as mutual protection and proof generation.",
    },
    {
      title: "Compliance OS forced into POS category",
      body: "NUPS was incorrectly compared to POS systems instead of being recognized as a compliance operating system.",
    },
    {
      title: "GlyphBucks misunderstood",
      body: "GlyphBucks is a liability tracking and accounting abstraction layer, not a barrier or gimmick.",
    },
    {
      title: "Architecture reduced to features",
      body: "NUPS is a unified chain of truth, not a collection of isolated tools.",
    },
  ];

  const reality = [
    "Clickwrap contract tied to transaction",
    "Video acknowledgment attached to legal record",
    "Biometric identity binding",
    "Customer executed payment flow",
    "ID credential verification",
    "Automatic audit-ready PDF generation",
    "Blockchain anchored ledger",
    "GlyphBucks liability tracking",
    "Master Covenant governance integration",
    "AI compliance enforcement layer",
    "Built-in dispute package generation",
  ];

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-5xl font-bold mb-6">
        When a Compliance OS Gets Misread as a POS
      </h1>

      <p className="mb-10 text-lg text-gray-300 max-w-3xl">
        This case study shows how AI misclassified GlyphLock NUPS by forcing
        it into a legacy payment category, missing its true function as a
        compliance operating system.
      </p>

      <h2 className="text-3xl mb-4">Misrepresentation Analysis</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {misreads.map((m) => (
          <div key={m.title} className="p-4 border border-gray-700">
            <h3 className="text-xl font-semibold">{m.title}</h3>
            <p className="text-gray-400 mt-2">{m.body}</p>
          </div>
        ))}
      </div>

      <h2 className="text-3xl mb-4">Correct Comparison</h2>
      <table className="w-full border border-gray-700 mb-12">
        <thead>
          <tr className="bg-gray-900">
            <th className="p-3 text-left">Capability</th>
            <th className="p-3 text-left">Legacy POS</th>
            <th className="p-3 text-left">NUPS</th>
          </tr>
        </thead>
        <tbody>
          {comparisonRows.map((row) => (
            <tr key={row.capability} className="border-t border-gray-800">
              <td className="p-3">{row.capability}</td>
              <td className="p-3 text-gray-400">{row.legacy}</td>
              <td className="p-3 text-cyan-400">{row.nups}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-3xl mb-4">Technical Reality</h2>
      <ul className="space-y-3 mb-12">
        {reality.map((r) => (
          <li key={r} className="text-gray-300">• {r}</li>
        ))}
      </ul>

      <h2 className="text-3xl mb-4">Conclusion</h2>
      <p className="text-gray-300 max-w-3xl">
        GlyphLock NUPS is not a POS system. It is a Compliance Operating
        System that transforms transactions into verifiable proof, redefining
        how high-risk commerce operates.
      </p>
    </main>
  );
}