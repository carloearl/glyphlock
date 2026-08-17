import React from "react";
import { ShieldCheck } from "lucide-react";
import PolicySection from "@/components/policy/PolicySection";
import PolicyCallout from "@/components/policy/PolicyCallout";
import PolicyTable from "@/components/policy/PolicyTable";

const META = [
  ["Issuing entity", "GlyphLock LLC (Arizona Entity No. 23831258)"],
  ["Document ID", "GL-COMP-001"],
  ["Version", "1.1 (supersedes Version 1.0)"],
  ["Effective date", "August 17, 2026"],
  ["Policy owner", "Carlo Rene Earl, Founder and Managing Member"],
  ["Review cycle", "At least annually; next scheduled review August 17, 2027"],
  ["Classification", "Public — approved for external distribution and due diligence"],
  ["Contact", "carloearl@glyphlock.com | https://glyphlock.io"],
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
            Code of Ethics and Anti-Corruption
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
          Code of Ethics, Anti-Corruption and Business Conduct Policy
        </h1>
        <p className="text-white/70 text-base md:text-lg mb-8">
          Integrity controls for responsible technology, payments, and hospitality partnerships.
        </p>

        <PolicyTable headers={["Field", "Detail"]} rows={META} />

        <PolicyCallout label="POLICY COMMITMENT">
          GlyphLock LLC conducts business lawfully, honestly, transparently, and without bribery,
          corruption, improper influence, retaliation, exploitation, or falsification of records.
        </PolicyCallout>

        <p className="text-white/60 text-sm mb-10">
          Prepared for partner, customer, vendor, processor, and marketplace due diligence. This
          document is adopted and in force as of the effective date shown above; the executed
          signature block appears at Section 19.
        </p>

        <PolicySection title="Revision History">
          <PolicyTable
            headers={["Version", "Date", "Owner", "Summary of change"]}
            rows={[
              ["1.0", "Initial issue", "Managing Member", "Original adoption. Core anti-bribery, gifts and courtesies, third-party, conflicts, books and records, AML, privacy, reporting, and governance framework."],
              ["1.1", "August 17, 2026", "Managing Member", "Added governing legal framework with statutory citations; independent escalation channel for concerns involving management; closed-loop stored-value (GlyphBucks) AML controls; labor integrity, age verification and anti-exploitation section; security incident notification commitment; third-party compliance flow-down requirement; executed adoption block; individual acknowledgment form (Appendix C); product naming standardized to Nexus Unified Portal System (NUPS)."],
            ]}
          />
        </PolicySection>

        <PolicySection number="1" title="Purpose and Leadership Commitment">
          <p>
            GlyphLock LLC ("GlyphLock") is committed to earning trust through lawful conduct,
            accurate records, responsible technology practices, and fair dealing. This Policy
            establishes minimum standards for ethical conduct and anti-corruption compliance across
            GlyphLock's business, including the development and operation of NUPS (Nexus Unified
            Portal System), closed-loop stored-value systems, partner integrations, customer
            relationships, procurement, sales, and marketplace activities.
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
            sources, implementation partners, vendors, and other third parties acting for or on
            behalf of GlyphLock.
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
              <><strong className="text-white">Respect and human dignity.</strong> Maintain a professional environment free from discrimination, harassment, retaliation, coercion, exploitation, and abuse.</>,
              <><strong className="text-white">Responsible technology.</strong> Design, integrate, and operate technology with appropriate security, privacy, access controls, auditability, and human oversight.</>,
            ]}
          />
        </PolicySection>

        <PolicySection number="4" title="Governing Legal Framework">
          <p>
            This Policy is designed to meet or exceed the standards of the laws and regulatory regimes
            below. Reference to a specific authority does not limit GlyphLock's obligation to comply
            with any other applicable law of any jurisdiction in which it operates.
          </p>
          <PolicyTable
            headers={["Domain", "Primary authority", "GlyphLock application"]}
            rows={[
              ["Anti-bribery", "U.S. Foreign Corrupt Practices Act, 15 U.S.C. 78dd-1 et seq. (anti-bribery and books-and-records provisions); 18 U.S.C. 201 (bribery of public officials); UK Bribery Act 2010 where applicable", "Sections 5, 6, 7, 8 and 11. The FCPA books-and-records standard is applied company-wide regardless of issuer status."],
              ["Sanctions and export", "Economic sanctions administered by the U.S. Treasury Office of Foreign Assets Control (OFAC); applicable export control rules", "Counterparty screening and payment controls under Section 12."],
              ["Anti-money laundering", "Bank Secrecy Act, 31 U.S.C. 5311 et seq., and FinCEN implementing regulations at 31 C.F.R. Chapter X; 31 C.F.R. 1010.100(ff)(4) (money transmission) and its closed-loop analysis", "Section 12, including closed-loop stored-value controls at Section 12.1."],
              ["Payments and card data", "Payment Card Industry Data Security Standard (PCI DSS) as required by processor and acquirer agreements; applicable card network rules", "Sections 11 and 14; processor and acquirer contractual obligations."],
              ["Labor and human rights", "Fair Labor Standards Act, 29 U.S.C. 201 et seq.; Trafficking Victims Protection Act, 22 U.S.C. 7101 et seq.; 18 U.S.C. 1589 and 1591; 18 U.S.C. 2257 recordkeeping where applicable; Arizona wage and worker classification law", "Section 13."],
              ["Privacy and security", "Applicable U.S. state privacy statutes; state data breach notification law including A.R.S. 18-552; contractual data protection terms; A.R.S. 13-3019 (unlawful recording) at venue sites", "Section 14."],
              ["Competition", "Sherman Act, 15 U.S.C. 1 et seq.; Federal Trade Commission Act Section 5; applicable state unfair competition law", "Section 10."],
            ]}
          />
        </PolicySection>

        <PolicySection number="5" title="Anti-Bribery and Anti-Corruption">
          <p>
            GlyphLock prohibits bribery in every form, whether involving a private person, customer,
            vendor, partner, or Government Official. The prohibition applies directly and indirectly,
            including through intermediaries or third parties. GlyphLock may be held responsible for
            the acts of a third party acting on its behalf.
          </p>
          <p>
            <strong className="text-white">Anything of value</strong> includes money, gift cards,
            stored value, digital assets, discounts, employment or internships, charitable or
            political contributions, travel, meals, entertainment, services, confidential
            information, debt forgiveness, favorable contract terms, complimentary venue access or
            hospitality, or any other personal or business benefit.
          </p>
          <Bullets
            items={[
              "Never offer or provide anything of value to influence a decision, secure preferential treatment, obtain confidential information, avoid a lawful requirement, or reward improper conduct.",
              "Never request or accept kickbacks, secret commissions, side payments, personal rebates, or benefits tied to a GlyphLock decision.",
              "Never use personal funds, false invoices, inflated fees, rebates, credits, marketing funds, charitable donations, or subcontractors to conceal a prohibited payment.",
              "Facilitation or grease payments are prohibited, even if locally customary, except where immediately necessary to protect a person's health or safety. Any emergency payment must be reported to the Policy Owner within 24 hours and recorded accurately in the books of account.",
            ]}
          />
        </PolicySection>

        <PolicySection number="6" title="Government Officials and Public-Sector Dealings">
          <p>
            <strong className="text-white">Government Official</strong> is interpreted broadly and
            includes elected or appointed officials; government employees; employees of
            government-owned or government-controlled entities; public international organization
            personnel; political parties and candidates; regulators, examiners, and licensing
            authorities; and anyone acting in an official capacity. For GlyphLock this expressly
            includes state and municipal liquor, gaming, adult-use, zoning, health, and business
            licensing personnel.
          </p>
          <p>
            Dealings involving Government Officials require enhanced care. No gift, meal, travel,
            entertainment, charitable contribution, political contribution, employment opportunity,
            venue access, or other benefit may be provided to a Government Official or close family
            member without advance written approval from the Managing Member and confirmation that
            the activity is lawful and permitted by the recipient's rules.
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
            headers={["Area", "Required control", "Approval / evidence"]}
            rows={[
              ["Cash and equivalents", "Prohibited, including gift cards, GlyphBucks or other stored value, cryptocurrency, loans, or personal reimbursements.", "No exception."],
              ["Commercial gifts", "Nominal, infrequent, not solicited, and never during an active bid, renewal, dispute, audit, or approval decision.", "Written approval above $100 per recipient per event or $250 aggregate annually."],
              ["Meals and entertainment", "Reasonable, business-related, attended by a GlyphLock representative, and not lavish. Adult entertainment, including complimentary access, services, or hospitality at a client venue, may never be provided as a business courtesy.", "Written approval above $100 per person. No approval is available for adult entertainment courtesies."],
              ["Travel and lodging", "Not offered or paid for customers, prospects, or officials unless required for a legitimate documented business purpose.", "Advance written approval and itemized receipts."],
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
              "Use a written agreement that defines legitimate services, compensation, compliance duties, audit and cooperation rights, and termination rights.",
              <><strong className="text-white">Compliance flow-down.</strong> Every third-party agreement must require the counterparty to comply with this Policy or an equivalent written standard, to comply with applicable anti-bribery, sanctions, AML, privacy, and labor law, to impose equivalent obligations on its own subcontractors, and to permit termination for breach. Absence of a flow-down clause is itself a red flag under Appendix B.</>,
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
            outside business interest that could affect, or appear to affect, objective judgment for
            GlyphLock. Disclosure must occur before the person participates in the affected decision.
          </p>
          <p>
            A disclosed conflict will be documented and managed through recusal, independent review,
            adjusted responsibilities, competitive sourcing, or termination of the conflicting
            activity, as appropriate. Where the Managing Member holds the conflict, the matter is
            escalated to the Independent Escalation Contact identified in Section 15.
          </p>
        </PolicySection>

        <PolicySection number="10" title="Fair Competition, Procurement and Customer Dealings">
          <Bullets
            items={[
              "Do not coordinate prices, customers, territories, bids, output, or hiring with competitors.",
              "Do not obtain or use confidential competitor, customer, partner, venue, or government information improperly.",
              "Represent NUPS capabilities, integrations, validation status, security posture, pricing, patent status, and customer results accurately. Pending intellectual property must be described as pending and never as granted or issued.",
              "Honor procurement rules, bid restrictions, channel requirements, partner policies, and customer authorization boundaries.",
              "Do not make false claims about partner or Oracle Partner Network status, marketplace listing or approval, production access, certification, audit results, or endorsement.",
            ]}
          />
        </PolicySection>

        <PolicySection number="11" title="Accurate Books, Records and Payment Controls">
          <p>
            GlyphLock requires complete, accurate, timely, and understandable records. Transactions
            must reflect their true purpose and must never be recorded in a misleading account or
            disguised through false descriptions. This standard applies to the company's own books
            and to any transaction record generated by GlyphLock systems on behalf of a customer
            venue.
          </p>
          <Bullets
            items={[
              "Maintain contracts, approvals, invoices, receipts, payment confirmations, expense records, and supporting evidence.",
              "Prohibit off-book accounts, undisclosed funds, false invoices, split transactions intended to avoid review, and unsupported reimbursements.",
              "Require appropriate authorization before commitments, refunds, credits, commissions, discounts, gifts, travel, or third-party payments.",
              "Separate approval, payment, and reconciliation responsibilities when staffing permits; where it does not, require documented owner review.",
              <><strong className="text-white">Revenue integrity in GlyphLock systems.</strong> Reported sales totals must reflect only settled cash and card sales. Closed-loop stored-value issuance is recorded as a liability and is never reported as sales revenue. No person may configure, override, or instruct a change to reporting logic that would misstate revenue, tax basis, tips, or contractor compensation.</>,
            ]}
          />
        </PolicySection>

        <PolicySection number="12" title="Anti-Money-Laundering, Sanctions and Fraud Prevention">
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
          <h3 className="text-lg font-bold text-white pt-2">12.1 Closed-Loop Stored Value (GlyphBucks)</h3>
          <p>
            GlyphLock and its affiliated issuing entity operate GlyphBucks, a closed-loop
            stored-value instrument used at participating venues. GlyphLock recognizes that stored
            value attracts heightened AML scrutiny and applies the following controls without
            exception.
          </p>
          <Bullets
            items={[
              <><strong className="text-white">Closed loop only.</strong> GlyphBucks is redeemable solely for goods and services at the issuing venue. It is not redeemable for cash, not transferable to third parties for value, not reloadable outside the venue point of sale, and not usable across unaffiliated merchants.</>,
              <><strong className="text-white">No cash-out.</strong> GlyphBucks is not converted back to cash, transferred to a bank account, exchanged for cryptocurrency, or sent to any external payment rail. Refunds follow the documented venue refund policy and are processed to the original payment method only.</>,
              <><strong className="text-white">Purchase controls.</strong> Issuance is recorded at point of sale against an identified transaction. Purchases at or above documented thresholds require government-issued identification verification, and structured or repeated purchases apparently intended to stay below a threshold are refused and escalated.</>,
              <><strong className="text-white">Liability accounting.</strong> Outstanding GlyphBucks is carried as an unredeemed liability, reconciled on a defined cycle, and never recognized as sales revenue. Unclaimed balances are handled in accordance with applicable Arizona unclaimed property requirements.</>,
              <><strong className="text-white">Records and audit.</strong> Issuance, redemption, adjustment, and void events are logged with operator identity and timestamp, retained under Section 18, and made available to processors, acquirers, auditors, and regulators on legitimate request.</>,
              <><strong className="text-white">Sanctions and counterparty screening.</strong> GlyphLock does not knowingly transact with sanctioned persons or entities and will pause and escalate any transaction raising a sanctions concern.</>,
            ]}
          />
          <PolicyCallout label="PROCESSOR TRANSPARENCY">
            GlyphLock will describe its stored-value model accurately and completely to payment
            processors, acquirers, and banking partners. Misdescribing the nature of a transaction,
            the merchant category, or the goods and services provided is a terminable violation of
            this Policy.
          </PolicyCallout>
        </PolicySection>

        <PolicySection number="13" title="Labor Integrity, Age Verification and Anti-Exploitation">
          <p>
            GlyphLock provides technology to hospitality and adult-entertainment venues. GlyphLock
            therefore treats human trafficking, coercion, and age-verification failure as top-tier
            compliance risks and holds itself and its customers to the standards below.
          </p>
          <Bullets
            items={[
              <><strong className="text-white">Zero tolerance for trafficking and coerced labor.</strong> GlyphLock will not knowingly do business with, provide technology to, or continue serving any party engaged in human trafficking, forced labor, debt bondage, coerced performance, or commercial sexual exploitation. Credible indicators require immediate escalation under Section 15.</>,
              <><strong className="text-white">Minors.</strong> No person under 18 may be employed by, contracted with, admitted to a restricted venue area by, or recorded as a worker or performer in any GlyphLock system. Any indication of a minor's involvement triggers immediate suspension of the activity, escalation, and reporting to appropriate authorities.</>,
              <><strong className="text-white">Age and identity verification.</strong> Venue-facing GlyphLock systems support government-issued identification capture and verification for workers, performers, and controlled transactions. Verification steps must not be bypassed, disabled, backdated, or recorded from an unverified source.</>,
              <><strong className="text-white">Independent contractor integrity.</strong> Where entertainers or other personnel are engaged as independent contractors, that classification must reflect the actual working relationship and comply with applicable law. GlyphLock systems must not be used to disguise employment, conceal wages, or misreport contractor compensation.</>,
              <><strong className="text-white">No unlawful deductions or coercive fees.</strong> GlyphLock will not design, configure, or knowingly operate fee, fine, quota, or house-fee mechanics that function as coerced labor, debt bondage, or unlawful wage deduction.</>,
              <><strong className="text-white">Dignity and safety.</strong> Workers and performers at customer sites must be treated with respect. Harassment, retaliation, intimidation, and unauthorized recording are prohibited, and GlyphLock supports customer no-recording rules including those grounded in A.R.S. 13-3019.</>,
              <><strong className="text-white">Reporting route.</strong> Any covered person, venue worker, or performer may report a concern under Section 15. Reports about exploitation or a minor are never subject to a waiting period, internal-first requirement, or non-disclosure restriction.</>,
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
              "Protect customer, venue, worker, entertainer, payment, biometric, and integration data according to applicable law and contract. Cardholder data is handled only in accordance with PCI DSS obligations and processor requirements.",
              "Test integrations using authorized environments and data; do not access production systems or customer records without written authorization. Live payment credentials are never used in demonstration or development environments.",
              "Report suspected security incidents, unauthorized access, data loss, or misuse to the Policy Owner immediately and in no case later than 24 hours after discovery.",
              <><strong className="text-white">Incident notification.</strong> On confirmation of a security incident affecting customer, venue, worker, or payment data, GlyphLock will notify affected customers and, where required, processors, regulators, and individuals without unreasonable delay and no later than 72 hours after confirmation, unless a shorter period is required by law or contract. Notification will describe what is known, what is affected, what is being done, and what the recipient should do.</>,
              "Maintain audit trails and human oversight for material automated decisions and sensitive workflows. Automated or agent-assisted processes must not execute financial, identity, or access changes without an accountable human approver.",
            ]}
          />
        </PolicySection>

        <PolicySection number="15" title="Reporting Concerns, Independent Escalation and Non-Retaliation">
          <p>
            Questions and concerns should be raised promptly to the Policy Owner at{" "}
            <a href="mailto:carloearl@glyphlock.com" className="text-blue-400 underline">carloearl@glyphlock.com</a>.
            Reports may involve suspected bribery, fraud, conflicts, retaliation, inaccurate records,
            security issues, exploitation, policy violations, or requests to bypass controls.
          </p>
          <p>
            <strong className="text-white">Independent channel.</strong> GlyphLock is a founder-led
            company in which the Policy Owner is also the principal decision maker. A concern that
            involves, implicates, or cannot be safely raised with the Managing Member must instead be
            directed to the Independent Escalation Contact below, who is engaged outside the
            management line and instructed to receive, review, and advise on such reports.
          </p>
          <PolicyTable
            headers={["Channel", "Route", "Use when"]}
            rows={[
              ["Policy Owner", "carloearl@glyphlock.com", "Routine questions, approvals, disclosures, and most concerns."],
              ["Independent Escalation Contact", "[NAME], [FIRM], [EMAIL], [PHONE] — outside counsel or accountant of record, engaged independent of management", "Concerns involving the Managing Member, ownership, financial reporting integrity, or where the reporter fears retaliation."],
              ["Confidential / anonymous intake", "[ethics@glyphlock.com or third-party intake service] — monitored by the Independent Escalation Contact; reporters may omit identifying information", "Any concern the reporter wishes to raise without identifying themselves."],
              ["External authorities", "Law enforcement, regulators, and government agencies", "Always available. Nothing in this Policy, any agreement, or any confidentiality obligation restricts a person from reporting suspected violations of law to a government authority or from receiving a lawful whistleblower award."],
            ]}
          />
          <p>
            GlyphLock prohibits retaliation against anyone who raises a concern in good faith, asks a
            compliance question, refuses to participate in suspected misconduct, or assists an
            investigation. Retaliation is itself a violation subject to the consequences in Section
            16. Knowingly false or malicious reports are not protected.
          </p>
          <PolicyCallout label="SPEAK-UP EXPECTATION">
            Pause the transaction when a red flag could involve bribery, fraud, improper influence,
            falsified records, sanctions, exploitation, or unauthorized access. Escalation is
            required before proceeding.
          </PolicyCallout>
        </PolicySection>

        <PolicySection number="16" title="Review, Investigation and Corrective Action">
          <p>
            GlyphLock will review reported concerns promptly, impartially, and as confidentially as
            reasonably possible. Covered persons must preserve relevant information and cooperate
            truthfully. Where a concern involves the Managing Member, the Independent Escalation
            Contact directs the review and the Managing Member is recused from decisions about it.
          </p>
          <p>
            Depending on the facts, GlyphLock may involve qualified counsel, accountants, security
            professionals, customers, partners, law enforcement, or regulators. Violations may result
            in removal from an assignment, suspension of payment, contract termination, disciplinary
            action up to termination of employment or engagement, recovery of losses, disclosure to
            affected parties, and referral to authorities where appropriate.
          </p>
        </PolicySection>

        <PolicySection number="17" title="Training, Certifications and Ongoing Monitoring">
          <p>
            The Policy Owner will provide or arrange risk-appropriate policy communication and
            training. Persons in higher-risk roles — including sales, procurement, finance, partner
            management, integrations, venue operations, and third-party management — must complete
            the acknowledgment at Appendix C on engagement and at least annually thereafter.
          </p>
          <p>
            GlyphLock will review this Policy at least annually and after material changes in law,
            business model, geography, partnership requirements, or identified risk. Monitoring will
            be proportionate to company size and risk and may include transaction sampling, expense
            review, access review, stored-value reconciliation review, third-party re-screening, and
            control remediation.
          </p>
        </PolicySection>

        <PolicySection number="18" title="Records Retention">
          <p>
            Compliance-related records should be retained for at least seven years unless a longer
            period is required by law, contract, investigation hold, tax requirement, or customer
            obligation. Records must be protected from unauthorized alteration or destruction and
            disposed of securely when retention obligations end. On notice of an actual or reasonably
            anticipated investigation, audit, claim, or litigation, routine disposal stops immediately
            for all potentially relevant records.
          </p>
        </PolicySection>

        <PolicySection number="19" title="Governance, Approval and Adoption">
          <p>
            The Founder and Managing Member is the initial Policy Owner and is responsible for
            implementation, approvals, documented exceptions, and annual review. As GlyphLock grows,
            compliance responsibilities may be delegated, but accountability remains with management.
          </p>
          <p>
            Exceptions are permitted only when lawful, documented, approved in writing before the
            activity, and consistent with the purpose of this Policy. No exception may authorize
            bribery, falsification, retaliation, fraud, sanctions evasion, exploitation, or
            unauthorized access.
          </p>
          <p>
            By executing below, GlyphLock's authorized management adopts the standards stated above,
            places them in force as of the effective date, and commits to implementing them
            proportionately to the company's size, activities, and risk.
          </p>
          <PolicyTable
            headers={["Field", "Detail"]}
            rows={[
              ["Approved by", "Carlo Rene Earl"],
              ["Title", "Founder and Managing Member, GlyphLock LLC"],
              ["Signature", "________________________________________"],
              ["Date", "________________________________________"],
            ]}
          />
          <p className="text-white/60 text-sm">
            This Policy is effective August 17, 2026 and supersedes Version 1.0. The controlled copy
            is maintained by the Policy Owner and published at https://glyphlock.io.
          </p>
        </PolicySection>

        <PolicySection title="Appendix A — Practical Approval Matrix">
          <PolicyTable
            headers={["Area", "Required control", "Approval / evidence"]}
            rows={[
              ["Gift or meal", "Check purpose, timing, recipient rules, amount, frequency, and decision context.", "Written approval when thresholds apply; retain receipt and attendees."],
              ["Government touchpoint", "Identify official status and applicable agency or entity rules before providing value.", "Advance written Managing Member approval."],
              ["Commission or referral", "Verify identity, ownership, services, market reasonableness, and payment destination.", "Written agreement with flow-down clause, due diligence record, invoice, and approval."],
              ["Discount or credit", "Document business reason and confirm it is not personal consideration.", "Authorized transaction record and reconciliation."],
              ["Stored-value issuance", "Confirm closed-loop terms, purchase threshold, identification where required, and liability posting.", "Point-of-sale record, operator identity, and periodic reconciliation."],
              ["Worker or performer onboarding", "Verify age and identity from government-issued identification; confirm classification reflects the actual relationship.", "Retained verification record and executed agreement."],
              ["Sensitive data access", "Confirm authorization, least privilege, environment, purpose, and retention.", "Access approval and auditable system record."],
              ["Exception", "Document facts, legal or contract basis, duration, controls, and owner.", "Written pre-approval; never for prohibited conduct."],
            ]}
          />
        </PolicySection>

        <PolicySection title="Appendix B — Stop-and-Escalate Red Flags">
          <Bullets
            items={[
              "A request for cash, a gift card, stored value, cryptocurrency, a personal-account payment, or payment to an unrelated third party.",
              "An unusually high commission, vague scope, backdated agreement, false description, or invoice that does not match work performed.",
              "A request to keep a relationship, payment, gift, discount, data access, or Government Official involvement secret.",
              "Pressure to act before due diligence, approval, documentation, screening, or contract completion.",
              "A promise of approvals, customer influence, confidential information, or government action in exchange for value.",
              "A request to misstate product readiness, partner or Oracle status, marketplace approval, patent status, customer validation, security controls, or transaction purpose.",
              "A counterparty that refuses a compliance flow-down clause, audit rights, or disclosure of beneficial ownership.",
              "Stored-value purchases structured below an identification threshold, requests to convert stored value to cash, or requests to move value off the closed loop.",
              "Any indicator of coerced labor, controlled or confiscated identification documents, a worker or performer who may be a minor, or a third party speaking or transacting on a worker's behalf.",
              "A request to disable, bypass, backdate, or fabricate age verification, identity capture, audit logging, or revenue reporting.",
            ]}
          />
        </PolicySection>

        <PolicySection title="Appendix C — Individual Acknowledgment and Certification">
          <p>
            Complete, sign, and return to the Policy Owner at{" "}
            <a href="mailto:carloearl@glyphlock.com" className="text-blue-400 underline">carloearl@glyphlock.com</a>.
            Required on engagement and at least annually thereafter for covered persons in
            higher-risk roles.
          </p>
          <p className="font-bold text-white">I certify that:</p>
          <Bullets
            items={[
              "I have received, read, and understand the GlyphLock LLC Code of Ethics, Anti-Corruption and Business Conduct Policy (GL-COMP-001, Version 1.1).",
              "I agree to comply with this Policy and with applicable law in all work performed for or on behalf of GlyphLock.",
              "I have disclosed any actual or potential conflict of interest, outside business or ownership interest, or relationship with a Government Official.",
              "To the best of my knowledge, I have not offered, given, requested, or received anything of value in violation of this Policy, and I am not aware of any unreported violation.",
              "I understand that I am required to report suspected violations, that I may report to the Independent Escalation Contact or anonymously, that retaliation is prohibited, and that nothing restricts my right to report to a government authority.",
              "I understand that violation of this Policy may result in disciplinary action up to termination of employment or engagement and referral to authorities.",
            ]}
          />
          <PolicyTable
            headers={["Field", "Entry"]}
            rows={[
              ["Disclosures (write \"None\" if not applicable)", "________________________________________"],
              ["Full name", "________________________________________"],
              ["Role", "________________________________________"],
              ["Company / entity", "________________________________________"],
              ["Date", "________________________________________"],
              ["Signature", "________________________________________"],
              ["Email", "________________________________________"],
            ]}
          />
        </PolicySection>

        <p className="text-white/50 text-xs md:text-sm border-t border-white/10 pt-6">
          Questions or reports: carloearl@glyphlock.com | https://glyphlock.io | GL-COMP-001 v1.1 |
          Effective August 17, 2026
        </p>
      </div>
    </div>
  );
}