import React from "react";
import { ShieldCheck } from "lucide-react";
import PolicySection from "@/components/policy/PolicySection";
import PolicyCallout from "@/components/policy/PolicyCallout";
import PolicyTable from "@/components/policy/PolicyTable";

const META = [
  ["Issuing entity", "GlyphLock LLC (Arizona Entity No. 23831258)"],
  ["Document ID", "GL-COMP-001"],
  ["Version", "1.4"],
  ["Effective date", "August 17, 2026"],
  ["Policy owner", "Carlo Rene Earl, Founder and Managing Member"],
  ["Classification", "Public / Partner Due Diligence"],
  ["Review cycle", "At least annually and upon material legal or business change"],
  ["Contact", "carloearl@glyphlock.com | https://glyphlock.io"],
];

const REFERENCES = [
  ["Oracle PartnerNetwork — Partner Code of Ethics and Business Conduct and enrollment attestations", "https://www.oracle.com/partner/"],
  ["U.S. Department of Justice and Securities and Exchange Commission — A Resource Guide to the U.S. Foreign Corrupt Practices Act", "https://www.justice.gov/criminal/criminal-fraud/fcpa-resource-guide"],
  ["Arizona Revised Statutes section 18-552 — Notification of security system breaches", "https://www.azleg.gov/ars/18/00552.htm"],
  ["Financial Crimes Enforcement Network — Prepaid Access Rule guidance and closed-loop exclusions", "https://www.fincen.gov/resources/statutes-regulations/guidance/final-rule-definitions-and-other-regulations-relating"],
  ["Financial Crimes Enforcement Network — Frequently Asked Questions regarding Prepaid Access, including risk-based seller controls", "https://www.fincen.gov/resources/statutes-regulations/guidance/frequently-asked-questions-regarding-prepaid-access"],
  ["Arizona Revised Statutes section 23-1601 — Declaration of independent business status", "https://www.azleg.gov/ars/23/01601.htm"],
  ["PCI Security Standards Council — Current PCI DSS materials", "https://www.pcisecuritystandards.org/document_library"],
];

const Bullets = ({ items }) => (
  <ul className="list-disc pl-5 space-y-2">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

export default function CodeOfEthics() {
  return (
    <div className="min-h-screen w-full py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-3">
          <ShieldCheck className="w-6 h-6 text-blue-400" />
          <span className="text-xs md:text-sm font-bold tracking-widest text-blue-400 uppercase">
            GlyphLock LLC · Compliance &amp; Ethics
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
          Code of Ethics, Anti-Corruption and Business Conduct Policy
        </h1>
        <p className="text-white/70 text-base md:text-lg mb-8">
          Integrity controls for responsible technology and hospitality partnerships.
        </p>

        <PolicyTable headers={["Field", "Detail"]} rows={META} />

        <PolicyCallout label="POLICY COMMITMENT">
          GlyphLock LLC conducts business lawfully, honestly, transparently, and without bribery,
          corruption, improper influence, retaliation, exploitation, or falsification of records.
        </PolicyCallout>

        <p className="text-white/60 text-sm mb-10 italic">
          Prepared for partner, customer, vendor, and marketplace due diligence.
        </p>

        <PolicySection title="Document Control">
          <p>
            This controlled public policy is approved by GlyphLock management for partner and
            marketplace due diligence. The Policy Owner maintains the controlled copy and reviews it
            at least annually and after material legal, contractual, product, or business changes.
          </p>
          <PolicyTable
            headers={["Version", "Date", "Summary"]}
            rows={[
              ["1.4", "Aug. 17, 2026", "Final controlled public release for Oracle partner and marketplace due diligence; incorporates stored-value limits, revenue integrity, labor/human-rights, independent-review, and acknowledgment controls; supersedes prior review copies."],
            ]}
          />
        </PolicySection>

        <PolicySection number="1" title="Purpose and Leadership Commitment">
          <p>
            GlyphLock LLC ("GlyphLock") is committed to earning trust through lawful conduct, accurate
            records, responsible technology practices, and fair dealing. This Policy establishes
            minimum standards for ethical conduct and anti-corruption compliance across GlyphLock's
            business, including the development and operation of NUPS (Nexus Unified POS System),
            partner integrations, customer relationships, procurement, sales, and marketplace
            activities.
          </p>
          <p>
            GlyphLock will not pursue revenue, access, approvals, listings, integrations, contracts,
            or competitive advantage through bribery, kickbacks, secret commissions, fraud, coercion,
            conflicts of interest, or improper influence. No business objective overrides this Policy.
          </p>
          <PolicyCallout label="ZERO-TOLERANCE RULE">
            No person acting for GlyphLock may offer, authorize, request, receive, conceal, or
            facilitate anything of value intended to improperly influence a decision or obtain an
            unfair advantage.
          </PolicyCallout>
        </PolicySection>

        <PolicySection number="2" title="Scope">
          <p>
            This Policy applies to GlyphLock's owners, officers, employees, temporary personnel, and,
            where contractually applicable, contractors, consultants, agents, resellers, referral
            sources, implementation partners, vendors, and other third parties acting for or on behalf
            of GlyphLock.
          </p>
          <p>
            Every covered person must comply with this Policy, applicable law, customer and partner
            requirements, and any stricter contractual standard. When standards differ, the stricter
            lawful standard controls.
          </p>
        </PolicySection>

        <PolicySection number="3" title="Core Ethical Principles">
          <Bullets
            items={[
              <><strong className="text-white">Integrity.</strong> Be truthful, keep commitments, and never misrepresent capabilities, approvals, certifications, customer results, or product readiness.</>,
              <><strong className="text-white">Lawful conduct.</strong> Follow applicable anti-bribery, anti-fraud, anti-money-laundering, sanctions, privacy, security, labor, competition, and procurement requirements.</>,
              <><strong className="text-white">Fair dealing.</strong> Compete on product value, service, security, and performance — never through deception, collusion, threats, or improper payments.</>,
              <><strong className="text-white">Accountability.</strong> Document decisions, preserve accurate records, disclose conflicts, and raise concerns promptly.</>,
              <><strong className="text-white">Respect.</strong> Maintain a professional environment free from discrimination, harassment, retaliation, exploitation, and abuse.</>,
              <><strong className="text-white">Responsible technology.</strong> Design, integrate, and operate technology with appropriate security, privacy, access controls, auditability, and human oversight.</>,
            ]}
          />
        </PolicySection>

        <PolicySection number="4" title="Legal and Partner Framework">
          <p>
            This Policy is an internal conduct standard. It supplements, and does not replace,
            applicable law or any binding Oracle PartnerNetwork, Oracle Marketplace, Oracle
            Hospitality Integration Platform, customer, processor, or vendor agreement. Those external
            terms control their respective relationships.
          </p>
          <PolicyTable
            headers={["Area", "Required Control", "Approval / Evidence"]}
            rows={[
              ["Oracle ecosystem", "Follow the Oracle Partner Code of Ethics and Business Conduct and all applicable OPN, Marketplace, and OHIP terms.", "Current agreement, approval, training, and listing records."],
              ["Anti-bribery", "Follow applicable anti-bribery and anti-fraud law, including the FCPA anti-bribery rules where applicable.", "Due diligence, approvals, invoices, and payment support."],
              ["Records and controls", "Use complete books and reasonable internal controls as a company-wide benchmark, without implying that issuer-only statutory provisions apply to GlyphLock.", "Contracts, ledgers, receipts, reconciliations, and review evidence."],
              ["Labor and human rights", "Follow applicable wage, worker-classification, anti-trafficking, age-verification, and venue-safety requirements based on GlyphLock's role and the operating context.", "Verification records, classification support, agreements, access decisions, and escalation records."],
              ["Privacy and security", "Follow applicable breach-notice, privacy, security, and contractual requirements based on GlyphLock's role and the affected data.", "Incident record, legal assessment, notifications, and remediation."],
              ["Payments and stored value", "Assess PCI, processor, sanctions, AML, and prepaid-access requirements before enabling a regulated feature.", "Product review, processor documentation, limits, and audit logs."],
            ]}
          />
        </PolicySection>

        <PolicySection number="5" title="Anti-Bribery and Anti-Corruption">
          <p>
            GlyphLock prohibits bribery in every form, whether involving a private person, customer,
            vendor, partner, or Government Official. The prohibition applies directly and indirectly,
            including through intermediaries or third parties. GlyphLock treats complete records and
            reasonable internal controls as a company-wide compliance benchmark, while recognizing
            that specific statutory accounting provisions may apply only to defined persons or
            entities.
          </p>
          <p>
            <strong className="text-white">Anything of value</strong> includes money, cash
            equivalents, gift cards, stored value, cryptocurrency, loans, discounts, rebates,
            commissions, equity, employment or internships, charitable or political contributions,
            sponsorships, travel, meals, entertainment, services, use of property, confidential
            information, debt forgiveness, personal favors, favorable contract terms, or any other
            personal or business benefit.
          </p>
          <Bullets
            items={[
              "Never offer or provide anything of value to influence a decision, secure preferential treatment, obtain confidential information, avoid a lawful requirement, or reward improper conduct.",
              "Never request or accept kickbacks, secret commissions, side payments, personal rebates, or benefits tied to a GlyphLock decision.",
              "Never use personal funds, false invoices, inflated fees, rebates, credits, marketing funds, charitable donations, or subcontractors to conceal a prohibited payment.",
              "Facilitation or grease payments are prohibited, even if locally customary, except where immediately necessary to protect a person's health or safety. Any emergency payment must be reported and documented promptly.",
            ]}
          />
        </PolicySection>

        <PolicySection number="6" title="Government Officials and Public-Sector Dealings">
          <p>
            <strong className="text-white">Government Official</strong> is interpreted broadly and
            includes elected or appointed officials; government employees; employees of
            government-owned or government-controlled entities; public international organization
            personnel; political parties and candidates; and anyone acting in an official capacity.
          </p>
          <p>
            Dealings involving Government Officials require enhanced care. No gift, meal, travel,
            entertainment, charitable contribution, political contribution, employment opportunity, or
            other benefit may be provided to a Government Official or close family member without
            advance written approval from the Managing Member and confirmation that the activity is
            lawful and permitted by the recipient's rules.
          </p>
          <PolicyCallout label="PUBLIC-SECTOR RULE">
            When in doubt, provide nothing of value, pause the activity, document the facts, and
            obtain written approval before proceeding.
          </PolicyCallout>
        </PolicySection>

        <PolicySection number="7" title="Gifts, Meals, Travel and Entertainment">
          <p>
            Business courtesies must serve a legitimate business purpose, be lawful, reasonable,
            infrequent, transparent, and never create an obligation or appearance of improper
            influence.
          </p>
          <PolicyTable
            headers={["Area", "Required Control", "Approval / Evidence"]}
            rows={[
              ["Cash and equivalents", "Prohibited, including gift cards, stored value, cryptocurrency, loans, or personal reimbursements.", "No exception."],
              ["Commercial gifts", "Nominal, infrequent, not solicited, and never during an active bid, renewal, dispute, audit, or approval decision.", "Written approval above $100 per recipient per event or $250 aggregate annually."],
              ["Meals/entertainment", "Reasonable, business-related, attended by a GlyphLock representative, and not lavish or adult entertainment.", "Written approval above $100 per person."],
              ["Travel/lodging", "Not offered or paid for customers, prospects, or officials unless required for a legitimate documented business purpose.", "Advance written approval and itemized receipts."],
              ["Government Officials", "No courtesy unless lawful, permitted by the recipient's rules, nominal, transparent, and unrelated to a decision.", "Advance written approval required for every instance."],
            ]}
          />
        </PolicySection>

        <PolicySection number="8" title="Commissions, Referrals and Third Parties">
          <p>
            Third parties can create risk for GlyphLock. Before engaging an agent, consultant,
            reseller, referral source, lobbyist, implementation partner, or other intermediary,
            GlyphLock will apply risk-based diligence appropriate to the relationship.
          </p>
          <Bullets
            items={[
              "Use a written agreement that defines legitimate services, compensation, compliance duties, audit/cooperation rights, and termination rights.",
              "Require risk-appropriate contractual flow-downs obligating third parties acting for GlyphLock to follow this Policy, applicable law, and relevant Oracle, customer, and processor requirements.",
              "Compensation must be commercially reasonable, proportionate to documented services, and paid only after required work is verified.",
              "Do not pay cash, anonymous instruments, personal accounts, unrelated third parties, or accounts in unrelated jurisdictions.",
              "Do not accept vague invoices, unusual urgency, excessive commissions, success fees tied to government action, refusal to disclose ownership, or requests to conceal the relationship.",
              "Escalate red flags before engagement or payment. Unresolved red flags stop the transaction.",
            ]}
          />
        </PolicySection>

        <PolicySection number="9" title="Conflicts of Interest">
          <p>
            Covered persons must disclose any personal, family, financial, employment, ownership, or
            outside-business interest that could affect — or appear to affect — objective judgment for
            GlyphLock. Disclosure must occur before the person participates in the affected decision.
          </p>
          <p>
            A disclosed conflict will be documented and managed through recusal, independent review,
            adjusted responsibilities, competitive sourcing, or termination of the conflicting
            activity, as appropriate. If the Policy Owner holds the conflict, the independent-review
            mechanism in Section 15 applies and the Policy Owner is recused from the decision.
          </p>
        </PolicySection>

        <PolicySection number="10" title="Fair Competition, Procurement and Customer Dealings">
          <Bullets
            items={[
              "Do not coordinate prices, customers, territories, bids, output, or hiring with competitors.",
              "Do not obtain or use confidential competitor, customer, Oracle, venue, or government information improperly.",
              "Represent NUPS capabilities, integrations, validation status, security posture, pricing, and customer results accurately.",
              "Honor procurement rules, bid restrictions, channel requirements, partner policies, and customer authorization boundaries.",
              "Do not make false claims about Oracle partnership status, Marketplace approval, production access, certification, or endorsement.",
            ]}
          />
        </PolicySection>

        <PolicySection number="11" title="Accurate Books, Records and Payment Controls">
          <p>
            GlyphLock requires complete, accurate, timely, and understandable records. Transactions
            must reflect their true purpose and must never be recorded in a misleading account or
            disguised through false descriptions.
          </p>
          <Bullets
            items={[
              "Maintain contracts, approvals, invoices, receipts, payment confirmations, expense records, and supporting evidence.",
              "Prohibit off-book accounts, undisclosed funds, false invoices, split transactions intended to avoid review, and unsupported reimbursements.",
              "Require appropriate authorization before commitments, refunds, credits, commissions, discounts, gifts, travel, or third-party payments.",
              "Separate approval, payment, and reconciliation responsibilities when staffing permits; where it does not, require documented owner review.",
              "Reported total sales must equal settled cash sales plus settled card sales. Stored-value issuance is recorded as a customer-funds and redemption liability and is excluded from sales totals until redemption is recognized under applicable accounting rules.",
            ]}
          />
        </PolicySection>

        <PolicySection number="12" title="Anti-Money-Laundering, Sanctions, Fraud and Stored Value">
          <p>
            GlyphLock will conduct business only with legitimate counterparties using funds derived
            from lawful activity. Transactions must have a clear business purpose and a reasonable
            relationship to the goods or services provided.
          </p>
          <p>
            Suspicious indicators — including inconsistent identities, unexplained third-party
            payments, unusual refund requests, rapid movement of funds, sanctions concerns, or
            resistance to documentation — must be paused and escalated. GlyphLock will not structure
            transactions to avoid reporting, screening, approval, or recordkeeping requirements.
          </p>
          <p>
            <strong className="text-white">GlyphBucks</strong> refers to physical club vouchers or
            tokens and any related digital closed-loop stored-value functionality supported by
            GlyphLock. Venue-issued physical instruments may be sold through a venue's live
            point-of-sale system and recorded by NUPS in an authorized parallel or production
            workflow. Any integrated digital wallet or materially expanded stored-value functionality
            requires documented legal, processor, security, accounting, and product-risk review before
            activation.
          </p>
          <Bullets
            items={[
              "Apply these controls to every pilot, parallel-mode record, venue deployment, and production use; do not describe a pilot or mirrored transaction as production processing.",
              "Unless a stricter approved limit applies, no more than $2,000 of value may be associated with a single GlyphBucks device, account, code, token, or other access vehicle on any day. This internal ceiling is designed around the federal closed-loop exclusion and does not itself determine whether a particular arrangement is exempt or regulated.",
              "Maintain risk-based policies and procedures reasonably adapted to prevent sales of more than $10,000 of any type of prepaid access to one person in one day. Monitor linked or repeated activity to the extent supported, refuse and escalate apparent structuring, and collect or verify customer information whenever required by law or an approved issuer, provider, processor, or acquirer procedure.",
              "Do not enable cash-out, except a de minimis refund required by applicable law, anonymous transfer, cross-merchant use, external reload, or another material scope change without renewed legal and compliance review.",
              "Record customer funds and redemption obligations accurately; do not treat unredeemed value as earned revenue except as permitted by applicable accounting rules.",
              "Disclose material terms, expiration or inactivity rules, refund conditions, fees, and authorized use clearly before acceptance.",
              "Pause suspicious activity and preserve relevant records for review; make reports to authorities when legally required or otherwise appropriate.",
            ]}
          />
        </PolicySection>

        <PolicySection number="13" title="Labor Integrity, Human Rights and Venue Safety">
          <p>
            GlyphLock prohibits forced labor, trafficking, coercion, unlawful discrimination,
            harassment, retaliation, wage falsification, and the knowing use of its systems to
            facilitate exploitation or conceal unlawful conduct.
          </p>
          <Bullets
            items={[
              "No person under 18 may be enrolled, contracted, credentialed, or recorded as a worker or performer in a GlyphLock system, and GlyphLock systems must not be configured to bypass a venue's lawful age restriction.",
              "Use identity, authorization, and access controls appropriate to the lawful workflow and venue context.",
              "Do not alter time, payout, gratuity, fee, classification, or transaction records to evade a legal or contractual obligation or misstate whether a person is an employee or independent contractor.",
              "Do not configure house fees, access restrictions, debt, withheld identification, threats, or payment controls to coerce continued work or conceal involuntary activity.",
              "Escalate credible indicators of trafficking, coercion, child exploitation, violence, or immediate danger without delay and contact emergency services when necessary.",
              "Design controls proportionately and avoid collecting sensitive data that is not necessary for an authorized purpose.",
            ]}
          />
        </PolicySection>

        <PolicySection number="14" title="Privacy, Security and Responsible Technology">
          <p>
            GlyphLock will collect, access, use, share, retain, and dispose of personal and
            confidential information only for authorized business purposes and with appropriate
            safeguards. Access must be limited by role and legitimate need.
          </p>
          <Bullets
            items={[
              "Use approved systems and credentials; never share passwords, secrets, API keys, tokens, or verification codes.",
              "Protect customer, venue, worker, entertainer, payment, biometric, and integration data according to applicable law and contract.",
              "Test integrations using authorized environments and data; do not access production systems or customer records without written authorization.",
              "Report suspected security incidents, unauthorized access, data loss, or misuse promptly.",
              "Maintain audit trails and human oversight for material automated decisions and sensitive workflows.",
            ]}
          />
          <p>
            GlyphLock will assess security incidents promptly and provide notices without unreasonable
            delay and within applicable legal or contractual deadlines. When GlyphLock maintains data
            for another owner or licensee, it will notify that party as soon as practicable as
            required by applicable law or contract. The incident record will identify the governing
            rule and deadline used for each required notice.
          </p>
        </PolicySection>

        <PolicySection number="15" title="Reporting Concerns and Non-Retaliation">
          <p>
            Questions and concerns should be raised promptly to the Policy Owner at{" "}
            <a href="mailto:carloearl@glyphlock.com" className="text-blue-400 underline">carloearl@glyphlock.com</a>.
            Reports may involve suspected bribery, fraud, conflicts, retaliation, inaccurate records,
            security issues, policy violations, or requests to bypass controls.
          </p>
          <p>
            GlyphLock prohibits retaliation against anyone who raises a concern in good faith, asks a
            compliance question, refuses to participate in suspected misconduct, or assists an
            investigation. Knowingly false or malicious reports are not protected.
          </p>
          <p>
            If a concern involves the Policy Owner or the reporter reasonably believes internal
            reporting is inappropriate, the reporter may contact an appropriate government or
            law-enforcement authority. Oracle reporting channels should be used only for matters
            involving Oracle personnel, programs, agreements, systems, or partner obligations.
            GlyphLock will appoint qualified outside counsel, an accountant, or another independent
            reviewer who is not implicated when independent review is warranted.
          </p>
          <PolicyCallout label="SPEAK-UP EXPECTATION">
            Pause the transaction when a red flag could involve bribery, fraud, improper influence,
            falsified records, sanctions, or unauthorized access. Escalation is required before
            proceeding.
          </PolicyCallout>
        </PolicySection>

        <PolicySection number="16" title="Review, Investigation and Corrective Action">
          <p>
            GlyphLock will review reported concerns promptly, impartially, and as confidentially as
            reasonably possible. Covered persons must preserve relevant information and cooperate
            truthfully. Depending on the facts, GlyphLock may involve qualified counsel, accountants,
            security professionals, customers, partners, law enforcement, or regulators.
          </p>
          <p>
            Violations may result in removal from an assignment, suspension of payment, contract
            termination, disciplinary action up to termination of employment or engagement, recovery
            of losses, disclosure to affected parties, and referral to authorities where appropriate.
          </p>
        </PolicySection>

        <PolicySection number="17" title="Training, Certifications and Ongoing Monitoring">
          <p>
            The Policy Owner will provide or arrange risk-appropriate policy communication and
            training. Persons in higher-risk roles — including sales, procurement, finance, partner
            management, integrations, and third-party management — may be required to complete
            periodic acknowledgments or certifications issued and retained separately from this public
            Policy.
          </p>
          <p>
            GlyphLock will review this Policy at least annually and after material changes in law,
            business model, geography, partnership requirements, or identified risk. Monitoring will
            be proportionate to company size and risk and may include transaction sampling, expense
            review, access review, third-party re-screening, and control remediation.
          </p>
        </PolicySection>

        <PolicySection number="18" title="Records Retention">
          <p>
            Compliance-related records should be retained for at least seven years unless a longer
            period is required by law, contract, investigation hold, tax requirement, or customer
            obligation. Records must be protected from unauthorized alteration or destruction and
            disposed of securely when retention obligations end.
          </p>
        </PolicySection>

        <PolicySection number="19" title="Governance and Approval">
          <p>
            The Founder and Managing Member is the initial Policy Owner and is responsible for
            implementation, approvals, documented exceptions, and annual review. As GlyphLock grows,
            compliance responsibilities may be delegated, but accountability remains with management.
          </p>
          <p>
            Exceptions are permitted only when lawful, documented, approved in writing before the
            activity, and consistent with the purpose of this Policy. No exception may authorize
            bribery, falsification, retaliation, fraud, sanctions evasion, or unauthorized access.
          </p>
        </PolicySection>

        <PolicySection title="Appendix A — Practical Approval Matrix">
          <PolicyTable
            headers={["Area", "Required Control", "Approval / Evidence"]}
            rows={[
              ["Gift / meal", "Check purpose, timing, recipient rules, amount, frequency, and decision context.", "Written approval when thresholds apply; retain receipt and attendees."],
              ["Government touchpoint", "Identify official status and applicable agency/entity rules before providing value.", "Advance written Managing Member approval."],
              ["Commission / referral", "Verify identity, ownership, services, market reasonableness, and payment destination.", "Written agreement, due diligence record, invoice, and approval."],
              ["Discount / credit", "Document business reason and confirm it is not personal consideration.", "Authorized transaction record and reconciliation."],
              ["Sensitive data access", "Confirm authorization, least privilege, environment, purpose, and retention.", "Access approval and auditable system record."],
              ["Stored-value issuance", "Confirm instrument type, venue, tender source, amount, $2,000 per-device daily ceiling, liability treatment, permitted use, redemption rules, and any applicable identity-review requirement.", "Issuance ledger, tender record, venue authorization, linked-activity review, and reconciliation."],
              ["Worker onboarding", "Verify age, identity, role, authorization, classification inputs, consent, and applicable venue restrictions.", "Onboarding record, access decision, and retained evidence."],
              ["Exception", "Document facts, legal/contract basis, duration, controls, and owner.", "Written preapproval; never for prohibited conduct."],
            ]}
          />
        </PolicySection>

        <PolicySection title="Appendix B — Stop-and-Escalate Red Flags">
          <Bullets
            items={[
              "A request for cash, a gift card, cryptocurrency, a personal-account payment, or payment to an unrelated third party.",
              "An unusually high commission, vague scope, backdated agreement, false description, or invoice that does not match work performed.",
              "A request to keep a relationship, payment, gift, discount, data access, or Government Official involvement secret.",
              "Pressure to act before due diligence, approval, documentation, screening, or contract completion.",
              "A promise of approvals, customer influence, confidential information, or government action in exchange for value.",
              "A request to misstate product readiness, Oracle status, Marketplace approval, customer validation, security controls, or transaction purpose.",
              "A third party's refusal to accept required anti-bribery, records, audit, cooperation, or termination flow-down terms.",
              "Repeated loads, splits, redemptions, refunds, or adjustments apparently structured to remain below a review or regulatory threshold.",
              "Signs of coercion, trafficking, withheld identification, threats, controlled movement, unexplained debt, or payment restrictions affecting a worker or performer.",
              "A request to disable, bypass, alter, delete, or backdate identity, age, consent, access, transaction, or verification evidence.",
            ]}
          />
        </PolicySection>

        <PolicySection title="Appendix C — Master Covenant Governance Alignment">
          <p>
            GlyphLock's Master Covenant is an internal governance framework. The following principles
            inform implementation of this Policy without disclosing proprietary enforcement methods,
            transaction data, pricing, security details, or other confidential material.
          </p>
          <Bullets
            items={[
              <><strong className="text-white">Lawful assent and incorporation.</strong> Duties arise through valid acceptance, authorization, contract, policy adoption, or other recognized legal process — not merely through exposure to a document.</>,
              <><strong className="text-white">Authorized scope and use.</strong> People, data, credentials, integrations, and funds may be used only for approved purposes and within defined authority.</>,
              <><strong className="text-white">Transparent billing and records.</strong> Charges, credits, commissions, stored value, refunds, and supporting evidence must be accurate, understandable, and auditable.</>,
              <><strong className="text-white">Quality and integrity preservation.</strong> Product, listing, security, validation, and customer claims must reflect current evidence and must not be manipulated for advantage.</>,
              <><strong className="text-white">Confidentiality and access control.</strong> Sensitive information is protected by need-to-know access, least privilege, retention controls, and secure handling.</>,
              <><strong className="text-white">Evidence preservation and accountability.</strong> Material approvals, access, transactions, incidents, and corrective actions must be recorded and preserved in proportion to risk.</>,
              <><strong className="text-white">Staged resolution.</strong> Concerns should be contained, investigated, corrected, and escalated using documented, lawful, and proportionate measures.</>,
            ]}
          />
          <PolicyCallout label="ORDER OF PRECEDENCE">
            For Oracle-related activities, applicable law and binding Oracle, OPN, Marketplace, and
            OHIP agreements control. This Policy governs internal conduct. The Master Covenant does
            not amend, supersede, or create rights under Oracle's terms.
          </PolicyCallout>
        </PolicySection>

        <PolicySection title="Appendix D — Legal and Program References">
          <p>
            These public authorities and program materials provide orientation for this Policy. They
            are not exhaustive, and the current law, regulation, official guidance, and executed
            agreement applicable to a specific activity control.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            {REFERENCES.map(([label, href]) => (
              <li key={href}>
                {label}:{" "}
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 underline break-all"
                >
                  {href}
                </a>
              </li>
            ))}
          </ul>
        </PolicySection>

        <PolicySection title="Adoption Record and Ownership">
          <p>
            GlyphLock LLC adopts the standards stated above and commits to implementing them
            proportionately to the company's size, activities, and risk. This record identifies
            management approval and policy ownership.
          </p>
          <PolicyTable
            headers={["Field", "Detail"]}
            rows={[
              ["Approved by", "Carlo Rene Earl"],
              ["Title", "Founder and Managing Member"],
              ["Effective date", "August 17, 2026"],
            ]}
          />
        </PolicySection>

        <p className="text-white/50 text-xs md:text-sm border-t border-white/10 pt-6">
          Questions or reports: carloearl@glyphlock.com | https://glyphlock.io | GL-COMP-001 |
          Public Policy | Version 1.4
        </p>
      </div>
    </div>
  );
}