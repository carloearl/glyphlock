import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Code2,
  CreditCard,
  Landmark,
  ShieldCheck,
  Users,
} from "lucide-react";

const Section = ({ eyebrow, title, children }) => (
  <section className="border-t border-white/10 py-14 md:py-20">
    <div className="grid gap-8 md:grid-cols-[220px_minmax(0,1fr)] md:gap-14">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
          {eyebrow}
        </p>
      </div>
      <div className="max-w-3xl">
        <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
          {title}
        </h2>
        <div className="mt-8 space-y-6 text-base leading-8 text-slate-300 md:text-lg md:leading-9">
          {children}
        </div>
      </div>
    </div>
  </section>
);

const PullQuote = ({ children }) => (
  <blockquote className="my-10 border-l-2 border-cyan-400 pl-6 text-2xl font-bold leading-snug text-white md:text-3xl">
    {children}
  </blockquote>
);

const partnerPaths = [
  {
    icon: Building2,
    label: "Venue operators",
    copy: "Evaluate clearly scoped NUPS modules in real workflows and measure the operational result.",
  },
  {
    icon: CreditCard,
    label: "Payment partners",
    copy: "Help build compliant, API-capable payment infrastructure for disclosed, difficult venue categories.",
  },
  {
    icon: Landmark,
    label: "Hospitality integrators",
    copy: "Accelerate enterprise validation without weakening security, accountability, or data ownership.",
  },
  {
    icon: Users,
    label: "Strategic investors",
    copy: "Bring experience in vertical SaaS, payments risk, hospitality, venue technology, or multi-location deployment.",
  },
  {
    icon: Code2,
    label: "Builders",
    copy: "Work on difficult environments with exact claims, measurable progress, and shared accountability.",
  },
];

export default function FounderStoryNarrative() {
  return (
    <article className="w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-[0_40px_120px_rgba(2,8,23,0.55)] backdrop-blur-xl">
      <header className="relative overflow-hidden px-6 py-16 md:px-12 md:py-24 lg:px-20">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(circle at 15% 10%, rgba(34,211,238,.18), transparent 34%), radial-gradient(circle at 88% 0%, rgba(99,102,241,.15), transparent 32%), linear-gradient(180deg, rgba(15,23,42,.2), rgba(2,6,23,.9))",
          }}
        />
        <div className="relative max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
            Carlo René Earl
          </p>
          <p className="mt-3 text-sm text-slate-400">
            Founder, Owner, CEO and DACO¹ — GlyphLock LLC
          </p>
          <h1 className="mt-8 text-5xl font-black leading-[0.96] tracking-[-0.04em] text-white md:text-7xl lg:text-8xl">
            This Is Not
            <br />
            a Resume
          </h1>
          <p className="mt-8 max-w-3xl text-xl font-medium leading-8 text-slate-200 md:text-2xl md:leading-9">
            This is what happens when someone who has lived inside the problem
            refuses to accept it as normal.
          </p>
          <p className="mt-8 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
            Before I had a software company, I had a view of operations most
            founders could never buy.
          </p>
          <p className="mt-8 text-xs leading-5 text-slate-500">
            ¹ DACO — Directing Architectural Control Officer, the internal role
            that holds final authority over architecture and governance
            decisions at GlyphLock.
          </p>
        </div>
      </header>

      <div className="px-6 md:px-12 lg:px-20">
        <Section eyebrow="Where it began" title="Before software, there was the floor.">
          <p>
            I spent years inside nightlife—as a DJ, at the front door, in
            security, in promotions, and close enough to management to see how
            the entire machine moved. From the outside, a venue can look like
            music, lights, drinks, and entertainment. From the inside, it is a
            live network of identity, access, money, labor, agreements, safety,
            reputation, and risk.
          </p>
          <p>Every night depends on dozens of handoffs.</p>
          <p>
            Who entered? Who verified the ID? Who had authority? What was
            purchased? Who approved the exception? What did the customer
            acknowledge? What was the performer owed? What did the manager
            promise? What evidence remained after the room went dark and
            everybody remembered the night differently?
          </p>
          <p>The people were working hard. The systems were not working together.</p>
          <p>
            Important decisions lived in separate devices, paper contracts,
            ordinary receipts, camera footage, text messages, spreadsheets, and
            memory. A receipt could show that money moved without showing the
            full context of why it moved. A verbal approval could disappear by
            morning. A disputed service could become one person's word against
            another's. The higher the risk, the more fragmented the evidence
            became.
          </p>
          <PullQuote>
            I did not discover this problem in a market report. I worked inside it.
          </PullQuote>
          <p>That is where the founder story of GlyphLock really begins.</p>
        </Section>

        <Section eyebrow="The origin question" title="The first question was hidden inside an image.">
          <p>
            In May 2025, Collin Vanderginst and I were talking in Arizona about
            camouflage—how a pattern can hide something in plain sight.
          </p>
          <p>Most conversations like that end when the subject changes. This one did not.</p>
          <PullQuote>
            What if the pattern is not only hiding information? What if the
            pattern itself can carry intelligence?
          </PullQuote>
          <p>
            That question became an experiment. We worked with
            least-significant-bit encoding and decoding to test whether
            permitted data could travel inside a familiar image while the image
            remained visually recognizable. Then the question expanded. What if
            an image could contain interactive regions? What if a symbol could
            resolve to verified context? What if a digital object could retain
            a relationship to its origin, instructions, permissions, and
            history instead of becoming an orphaned copy the moment it left its
            creator's hands?
          </p>
          <p>The early work looked like image technology. The deeper idea was continuity.</p>
          <PullQuote>Context should remain bound to the thing it describes.</PullQuote>
          <p>
            That principle is the bridge between the concealed-image carrier,
            GlyphLock's secure QR and interactive-media work, the Master
            Covenant, and NUPS. They are not disconnected inventions competing
            for attention. They are different expressions of the same
            architecture:
          </p>
          <p className="text-xl font-bold text-cyan-100 md:text-2xl">
            identity + intent + action + evidence, connected through time.
          </p>
        </Section>

        <Section eyebrow="The build" title="GlyphLock was built under real pressure.">
          <p>
            I formed GlyphLock LLC in Arizona on May 24, 2025. There was no
            inherited laboratory, no large engineering department, and no
            venture fund waiting to finance the first build.
          </p>
          <p>
            There was an idea, a small human team, a family that needed
            stability, bills that kept arriving, and the kind of pressure that
            makes most ambitious projects shrink into something easier to
            explain.
          </p>
          <p>
            Some potential partners stepped away. Some people could see
            individual features but not the architecture connecting them.
            Others were willing to encourage the vision until the work required
            time, risk, money, or accountability.
          </p>
          <p className="text-2xl font-black text-white">So we bootstrapped.</p>
          <p>
            I built while working. I learned what I did not know. I turned venue
            problems into workflows, workflows into specifications, and
            specifications into software. I assembled hardware, tested scanners
            and cameras, worked through identity and role logic, designed
            contracts, traced transaction evidence, rebuilt permissions, and
            kept narrowing the distance between an idea and something a real
            operator could touch.
          </p>
          <p>
            That process was not clean. It was iterative, expensive in ways that
            do not appear on a balance sheet, and carried through periods when
            nearly every part of life was demanding attention at the same time.
          </p>
          <p>
            But it produced something more valuable than a polished origin myth.
            It produced a working system shaped by the environment it is meant
            to serve.
          </p>
        </Section>

        <Section eyebrow="The product" title="NUPS is the operational form of the idea.">
          <p>
            NUPS—the Nexus Unified POS System—is GlyphLock's flagship
            venue-operations platform.
          </p>
          <p>
            It connects front-door identity and age-verification workflows with
            role-based access, staff and independent-contractor onboarding,
            agreements, VIP activity, receipts, transaction evidence,
            approvals, batches, reconciliation, and audit history.
          </p>
          <p>
            The point is not to collect more data for the sake of collecting
            data. The point is to preserve the right context at the moment
            responsibility changes hands.
          </p>
          <p>
            When a guest arrives, the record should show the verification
            workflow that allowed access. When a service is sold, the record
            should connect the people, authorization, agreement, and receipt
            that explain it. When an exception occurs, the system should show
            who approved it. When a batch closes, the numbers should reconcile
            without rewriting liabilities as revenue or hiding activity inside
            a net total.
          </p>
          <p>
            That is why NUPS treats entertainers according to their actual
            independent-contractor role. It is why closed-loop value cannot be
            disguised as sales. It is why gross activity must remain visible
            before net reporting. It is why permissions, signatures, timestamps,
            and audit history are not back-office decorations.
          </p>
          <PullQuote>They are the product.</PullQuote>
        </Section>

        <Section eyebrow="From prototype to operation" title="The first venue was not chosen because it was easy.">
          <p>
            Dream Palace in Tempe, Arizona became the first live venue use case
            and the most demanding classroom the product could have chosen.
          </p>
          <p>
            NUPS has been used there in real venue workflows while development,
            hardening, and module-specific validation continue. Front-door
            check-in, identity data capture, venue roles, contracts, transaction
            evidence, and operating controls have moved beyond slides and into
            the environment they were designed around.
          </p>
          <p>That distinction matters.</p>
          <p>
            GlyphLock is not presenting NUPS as a finished universal platform or
            pretending every roadmap item is already in production. Readiness
            remains specific to the module, venue, payment provider, and
            integration. What exists today is more useful than a grand claim:
            working software, hardware-tested workflows, a live operating
            context, documented defects, and a founder close enough to the floor
            to see what fails before a distant product team would know it was
            possible.
          </p>
          <p>
            Nightlife and adult-entertainment operations combine high
            transaction values, identity and age requirements, independent
            contractors, cash and card activity, performer payments, private
            services, security concerns, chargeback exposure, and strict
            processor scrutiny. A system that can create trustworthy operational
            continuity there is being trained in one of hospitality's hardest
            environments.
          </p>
          <PullQuote>That is the wedge.</PullQuote>
          <p>
            The larger opportunity is not limited to one category of venue.
            Hotels, resorts, casinos, arenas, restaurants, entertainment
            districts, and other complex properties all depend on handoffs among
            people, permissions, services, transactions, and systems. The rules
            change. The need for continuity does not.
          </p>
        </Section>

        <Section eyebrow="The people" title="The team was built around the work.">
          <p>GlyphLock is founder-led, but it is not a one-person mythology.</p>
          <div className="grid gap-4 pt-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
              <h3 className="text-lg font-bold text-white">
                Carlo René Earl — Founder, Owner, CEO, and DACO
              </h3>
              <p className="mt-3">
                I direct the product vision, system architecture,
                intellectual-property strategy, partner development, and
                commercialization. My advantage is not a conventional résumé.
                It is the combination of venue operations, music, security,
                design, hardware, software, and firsthand exposure to the cost
                of fragmented evidence.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
              <h3 className="text-lg font-bold text-white">
                Collin Vanderginst — Chief Technology Officer
              </h3>
              <p className="mt-3">
                Collin was present at the camouflage conversation that helped
                trigger the original carrier question. He brings practical
                experience across hardware, networking, surveillance, and
                distributed security operations, including field work
                supporting accounts across Arizona. He helps keep the
                architecture connected to the physical environments where it
                must function.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
              <h3 className="text-lg font-bold text-white">
                Jacub Lough — Chief Security Officer and Chief Financial Officer
              </h3>
              <p className="mt-3">
                Jacub brings the operator's discipline of finance, security,
                risk, and commercialization. His experience building and running
                the IceVault88 jewelry business gives him a direct understanding
                of inventory value, trust, customer relationships, loss
                prevention, and the difference between an impressive idea and a
                business that must account for every dollar.
              </p>
            </div>
          </div>
          <p>
            We do not need to have identical backgrounds. We need to cover the
            distance between invention and dependable operation.
          </p>
        </Section>

        <Section eyebrow="The enterprise path" title="Progress without pretending we have already arrived.">
          <p>
            On August 19, 2026, GlyphLock's Oracle PartnerNetwork membership was
            approved and activated. NUPS is developing against the Oracle
            Hospitality Integration Platform partner environment, and Oracle's
            Simphony integration team has encouraged completion of its formal
            integration-validation process.
          </p>
          <div className="my-8 flex gap-4 rounded-2xl border border-amber-300/25 bg-amber-400/[0.06] p-6 text-amber-50">
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-amber-300" />
            <p className="leading-7">
              This is a meaningful step. It is not an Oracle endorsement, a
              completed validation, or a Marketplace listing.
            </p>
          </div>
          <p>
            The next gates are clear: complete the technical work, validate the
            integration, prepare the listing, secure the right customer
            environment, and prove that the system can exchange data safely at
            enterprise scale.
          </p>
          <p>
            That is how GlyphLock will describe progress: by the gate actually
            passed, not the gate we hope comes next.
          </p>
          <PullQuote>
            Credibility is not created by making the biggest possible claim. It
            is created when each claim survives inspection.
          </PullQuote>
        </Section>

        <Section eyebrow="The covenant" title="The system must hold us accountable first.">
          <p>
            The Master Covenant is not a substitute for product execution, legal
            review, or commercial proof. It is the operating discipline beneath
            the company.
          </p>
          <PullQuote>
            No claim should outrun its evidence. No action should be separated
            from its authority. No creator, operator, customer, or partner
            should have to surrender the truth in order to participate.
          </PullQuote>
          <p>That rule applies to the technology and to us.</p>
          <p>
            It means disclosing the real merchant category instead of disguising
            risk. It means separating the software provider from the merchant of
            record. It means distinguishing a roadmap from a release, a partner
            membership from a validated integration, and a live use case from
            repeatable scale.
          </p>
        </Section>

        <Section eyebrow="Why join now" title="The work is ready to be examined, tested, and shaped.">
          <p>
            GlyphLock is at the stage where the right partners can still shape
            the deployment model, integration priorities, and path to
            market—but the work is far enough along to be tested against
            reality.
          </p>
          <div className="grid gap-4 pt-3 md:grid-cols-2">
            {partnerPaths.map(({ icon: Icon, label, copy }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
              >
                <Icon className="h-5 w-5 text-cyan-300" />
                <h3 className="mt-4 text-base font-bold text-white">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
              </div>
            ))}
          </div>
          <p>
            We are not asking anyone to invest in pain, personality, or a
            dramatic founder story.
          </p>
          <p>We are asking them to examine the advantage the story produced:</p>
          <PullQuote>
            a founder with uncommon access to the problem, a working platform
            born inside the market, an unforgiving first use case, an enterprise
            integration path, and a system designed around a need that does not
            disappear when the industry changes.
          </PullQuote>
        </Section>

        <section className="border-t border-white/10 py-16 md:py-24">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
              The next chapter
            </p>
            <h2 className="mt-5 text-4xl font-black tracking-tight text-white md:text-6xl">
              The next chapter is scale.
            </h2>
            <div className="mt-8 max-w-3xl space-y-6 text-base leading-8 text-slate-300 md:text-lg md:leading-9">
              <p>
                For most of my life, I measured progress by what I could survive.
              </p>
              <p className="text-2xl font-black text-white">
                Survival is not the standard anymore.
              </p>
              <p>
                The standard is whether GlyphLock can make a venue safer to
                operate, easier to reconcile, harder to dispute, and more
                valuable over time. Whether NUPS can move from one live
                environment to a repeatable deployment. Whether our integrations
                can pass external validation. Whether our partners can earn
                money because the system creates trust instead of merely
                promising it.
              </p>
              <p>
                I do not need the world to believe every future version of
                GlyphLock today. I need the right people to look closely at what
                has already been built, understand why this team could see it,
                and help prove what comes next.
              </p>
              <p className="pt-4 text-2xl font-black leading-snug text-white md:text-3xl">
                This is not a résumé.
                <br />
                It is the record of how experience became architecture.
              </p>
              <p>And this is the invitation to build the next chapter with us.</p>
            </div>

            <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/NUPSReport"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                Review the NUPS evidence
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/partners"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-6 py-3.5 font-bold text-white transition hover:border-cyan-300/60 hover:bg-white/[0.08]"
              >
                Explore a founding partnership
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-bold text-cyan-200 transition hover:bg-cyan-400/10"
              >
                Contact Carlo
              </Link>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}
