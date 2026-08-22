import React from "react";
import { Link } from "react-router-dom";
import { Building2, CreditCard, Plug, Code2, TrendingUp } from "lucide-react";

const PATHS = [
  {
    icon: Building2,
    title: "Venue operators",
    body: "Run doors, entertainers, drivers, VIP, and nightly settlement on one system with a reconstructable record of the night.",
    cta: "Review the operating report",
    to: "/NUPSReport"
  },
  {
    icon: CreditCard,
    title: "Payment partners",
    body: "NUPS is processor-agnostic and posts against the venue's own processor relationship. We are looking for acquiring and processing partners comfortable with this segment.",
    cta: "Start a conversation",
    to: "/contact"
  },
  {
    icon: Plug,
    title: "Integrators and hospitality vendors",
    body: "Property-management, POS, and hospitality-platform integrations are partner-dependent by design. Documented paths exist and are open to co-development.",
    cta: "Partner with us",
    to: "/partners"
  },
  {
    icon: Code2,
    title: "Builders and engineers",
    body: "Carrier verification, evidence recordkeeping, ledger posting, and hardware-edge reliability are the live engineering problems here.",
    cta: "Get in touch",
    to: "/contact"
  },
  {
    icon: TrendingUp,
    title: "Investors",
    body: "The wedge is the hardest venue category on purpose. The question worth diligencing is how far hardened workflows transfer into easier hospitality markets.",
    cta: "Request the operating record",
    to: "/contact"
  }
];

export default function OpportunityPaths() {
  return (
    <section id="opportunities" className="w-full max-w-6xl mb-16">
      <h2 className="text-3xl sm:text-4xl font-black text-white text-center mb-3">
        Where This Goes Next
      </h2>
      <p className="text-blue-300 text-center mb-10 max-w-2xl mx-auto">
        Five ways to engage, depending on what you do.
      </p>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PATHS.map(({ icon: Icon, title, body, cta, to }) => (
          <div
            key={title}
            className="flex flex-col rounded-2xl p-7 border border-white/10 bg-white/[0.03] backdrop-blur-md transition-colors hover:border-blue-400/40"
          >
            <Icon className="w-8 h-8 text-blue-300 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-blue-100/80 leading-relaxed flex-1">{body}</p>
            <Link
              to={to}
              className="mt-6 inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm"
            >
              {cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}