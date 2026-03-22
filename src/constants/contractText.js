/**
 * SINGLE SOURCE OF TRUTH — CONTRACT LEGAL LANGUAGE
 * All contract components import from this file only.
 * DO NOT duplicate contract text anywhere else.
 */

export const ENTERTAINER_LICENSE_AGREEMENT = (venue) => `INDEPENDENT ENTERTAINER LICENSE AGREEMENT

THIS INDEPENDENT ENTERTAINER LICENSE AGREEMENT ("Agreement") is entered into as of the date of execution set forth below ("Effective Date"), by and between:

${venue.name}, an Arizona business entity, with its principal place of business located at ${venue.address}, operating under GlyphLock LLC venue management infrastructure (hereinafter referred to as "Club," "Venue," or "Licensor");

AND the undersigned individual (hereinafter referred to as "Entertainer" or "Licensee"), whose identity has been verified through government-issued identification, photographic capture, and biometric verification as recorded in the GlyphLock NUPS system.

RECITALS

WHEREAS, Club operates a licensed entertainment venue in Arizona providing venue space and security services for independent entertainment professionals;

WHEREAS, Entertainer operates an independent entertainment business and desires to obtain a revocable, non-exclusive license to access designated areas of the Premises for the purpose of providing lawful entertainment services directly to patrons;

WHEREAS, the Parties expressly intend to establish a purely commercial licensing relationship with absolutely no employer-employee, partnership, joint venture, or agency relationship created or implied;

NOW, THEREFORE, in consideration of the mutual covenants herein, the Parties agree as follows:

ARTICLE I — INDEPENDENT CONTRACTOR STATUS

1.1 This Agreement establishes a purely commercial licensing arrangement. Entertainer is an independent contractor operating her own separate business. No employer-employee relationship is created. Club exercises no control over the manner, means, or methods of Entertainer's services.

1.2 Entertainer is solely responsible for all federal, state, and local taxes on all income earned, including self-employment taxes. Club shall not withhold any taxes on Entertainer's behalf.

1.3 Entertainer has no authority to bind Club to any contract or obligation and shall not represent herself as an employee or agent of Club to any third party.

ARTICLE II — LICENSE GRANT

2.1 Club grants Entertainer a non-exclusive, revocable, non-transferable license to access designated areas of the Premises during Business Hours for the sole purpose of providing lawful Performance Services to Patrons. This license is revocable at will by Club at any time, for any reason, with or without notice.

2.2 This license is conditioned upon: (a) compliance with all applicable law; (b) compliance with all Club Rules; (c) maintenance of all required licenses; (d) payment of all License Fees when due; (e) completion of all intake procedures through GlyphLock NUPS including biometric verification and contract execution.

ARTICLE III — LICENSE FEES AND EARNINGS

3.1 Entertainer shall pay Club a License Fee for each Shift worked. The amount is set by Club management per shift and disclosed through GlyphLock NUPS prior to each Shift. Check-in through NUPS constitutes acceptance of the License Fee for that Shift.

3.2 All Tips, GlyphBucks, performance fees, and other compensation paid directly to Entertainer by Patrons are the sole and exclusive property of Entertainer. Club makes no claim to Entertainer's Tips or earnings. Club makes no guarantees regarding earnings.

3.3 GlyphBucks received from Patrons may be redeemed through GlyphLock NUPS at the conclusion of each Shift, subject to the GlyphBucks Terms of Use.

ARTICLE IV — ENTERTAINER OBLIGATIONS

4.1 AGE REQUIREMENT: Entertainer warrants she is at least ${venue.age_requirement} years of age and has provided valid government-issued photo identification. Misrepresentation of age constitutes immediate grounds for termination and may result in civil and criminal liability.

4.2 Entertainer shall obtain and maintain all licenses, permits, and certifications required by applicable law for the provision of entertainment services in the jurisdiction where the Premises is located.

4.3 Entertainer shall at all times comply with all applicable federal, state, and local laws and regulations, including all applicable Arizona Revised Statutes.

4.4 PROHIBITED CONDUCT — Entertainer shall not engage in: (a) any illegal activity; (b) solicitation of Patrons for services outside the Premises; (c) use of controlled substances or alcohol while working; (d) physical or verbal abuse of any person; (e) theft or fraud of any kind; (f) violation of any Club Rule; (g) unauthorized recording of Patrons or Club operations.

4.5 NON-SOLICITATION: During this Agreement and for six (6) months following termination, Entertainer shall not directly solicit any Patron met at the Premises for private services outside the Premises.

4.6 BIOMETRIC CONSENT: Entertainer consents to collection and storage of biometric data including photographic image and thumbprint through GlyphLock NUPS for identity verification and security purposes.

ARTICLE V — LIABILITY AND INDEMNIFICATION

5.1 TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, ENTERTAINER HEREBY RELEASES, WAIVES, AND DISCHARGES CLUB, ITS OFFICERS, MEMBERS, MANAGERS, AND AFFILIATES FROM ANY AND ALL CLAIMS ARISING OUT OF OR RELATED TO ENTERTAINER'S PRESENCE ON THE PREMISES OR PROVISION OF PERFORMANCE SERVICES.

5.2 Entertainer shall indemnify, defend, and hold harmless Club and GlyphLock LLC from any and all claims, liabilities, losses, damages, and expenses (including attorneys' fees) arising from: (a) any breach by Entertainer of this Agreement; (b) any negligent or wrongful act by Entertainer; (c) Entertainer's failure to comply with applicable law; (d) any employment classification claim.

5.3 IN NO EVENT SHALL CLUB BE LIABLE TO ENTERTAINER FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.

ARTICLE VI — TERM AND TERMINATION

6.1 Club may terminate this Agreement at any time, with or without cause, with or without notice, in Club's sole discretion. No wrongful termination claims, severance, or employment benefits arise from termination.

6.2 Upon termination: (a) Entertainer's license immediately terminates; (b) all outstanding License Fees become immediately due; (c) Entertainer shall immediately vacate the Premises.

ARTICLE VII — DISPUTE RESOLUTION

7.1 GOVERNING LAW: This Agreement shall be governed by Arizona law. Maricopa County, Arizona is the exclusive venue.

7.2 MANDATORY BINDING ARBITRATION: ANY AND ALL DISPUTES ARISING OUT OF OR RELATING TO THIS AGREEMENT SHALL BE RESOLVED BY BINDING ARBITRATION IN MARICOPA COUNTY, ARIZONA. THE DECISION OF THE ARBITRATOR IS FINAL AND BINDING.

7.3 WAIVER OF JURY TRIAL: ENTERTAINER IRREVOCABLY WAIVES ALL RIGHTS TO A JURY TRIAL IN CONNECTION WITH ANY DISPUTE.

7.4 WAIVER OF CLASS ACTION: ENTERTAINER WAIVES ANY RIGHT TO BRING ANY DISPUTE AS A CLASS, COLLECTIVE, OR REPRESENTATIVE ACTION.

ARTICLE VIII — GENERAL PROVISIONS

8.1 ELECTRONIC EXECUTION: Execution through GlyphLock NUPS constitutes a valid and binding electronic signature under the E-SIGN Act and Arizona Electronic Transactions Act (A.R.S. § 44-7001 et seq.). Biometric verification constitutes additional authentication of identity and intent to be bound.

8.2 This Agreement constitutes the entire agreement between the Parties and supersedes all prior agreements. Club reserves the right to amend this Agreement with notice to Entertainer through GlyphLock NUPS.

8.3 If any provision is held invalid or unenforceable, the remaining provisions continue in full force.

BY EXECUTING THIS AGREEMENT ELECTRONICALLY THROUGH GLYPHLOCK NUPS, ENTERTAINER ACKNOWLEDGES THAT SHE HAS READ THIS ENTIRE AGREEMENT, UNDERSTANDS ITS TERMS, AND AGREES TO BE LEGALLY BOUND BY ALL PROVISIONS.
`;

export const VIP_ROOM_SERVICE_AGREEMENT = (venue, booking) => `VIP ROOM SERVICE AGREEMENT

Contract ID: ${booking.uuid}
Venue: ${venue.name} | ${venue.address}
Date: ${booking.timestamp}
Guest: ${booking.guest_name}
Room: ${booking.room_number}
Duration: ${booking.duration_minutes} minutes
Minimum Spend: $${booking.minimum_spend}

NOTICE: THIS IS A BINDING LEGAL CONTRACT. BY SIGNING, YOU AGREE TO ALL TERMS BELOW. ALL PAYMENTS ARE NON-REFUNDABLE ONCE SERVICES COMMENCE.

TERMS AND CONDITIONS

1. VOLUNTARY PARTICIPATION AND CAPACITY
Guest represents that Guest is entering this Agreement voluntarily, of Guest's own free will, with full legal capacity to contract. Guest is at least ${venue.age_requirement} years of age and has provided valid government-issued photo identification. Guest represents that Guest is not under the influence of any substance that would impair Guest's judgment or legal capacity. Voluntary intoxication does not negate Guest's legal obligations under this Agreement.

2. IRREVOCABLE PAYMENT AUTHORIZATION
By signing this Agreement, Guest irrevocably authorizes Venue to charge the payment method provided for the full Minimum Spend plus any additional services ordered during the VIP session. Payment is due in full at the conclusion of the session.

3. NON-REFUNDABLE SERVICES
All VIP room services, entertainment services, and GlyphBucks issued pursuant to this Agreement are non-refundable once the VIP session commences.

4. ANTI-CHARGEBACK COVENANT
Guest expressly covenants not to initiate, authorize, or cooperate with any chargeback, dispute, reversal, or claim with any bank, credit card company, or payment processor regarding any charges made pursuant to this Agreement. Guest acknowledges that initiating a chargeback for services actually received constitutes fraud and breach of this Agreement. Venue shall be entitled to recover all amounts charged back plus $500.00 per incident in liquidated damages, plus reasonable attorneys' fees and all costs of collection. Venue may report fraudulent chargebacks to law enforcement.

5. INDEPENDENT CONTRACTOR SERVICES
All entertainment services are provided by independent contractors who are not employees, agents, or representatives of Venue or GlyphLock LLC. Venue is not responsible for the actions, representations, or conduct of any independent contractor.

6. GLYPHBUCKS / CLUB CURRENCY TERMS
GlyphBucks issued pursuant to this Agreement may be used exclusively at ${venue.name} during the current visit. GlyphBucks have no cash value, are non-transferable, non-refundable, and expire at the close of business on the date of issuance. Unused GlyphBucks are forfeited without compensation or credit.

7. BIOMETRIC AND SURVEILLANCE CONSENT
Guest consents to collection of photographic image and government ID scan through GlyphLock NUPS for identity verification and security purposes. Guest consents to video surveillance of all Premises areas. Biometric and surveillance data may be used in connection with any dispute.

8. LIMITATION OF LIABILITY
IN NO EVENT SHALL VENUE OR GLYPHLOCK LLC BE LIABLE TO GUEST FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. VENUE'S TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY GUEST FOR THE SESSION GIVING RISE TO THE CLAIM.

9. ASSUMPTION OF RISK
Guest assumes all risks associated with attendance at an entertainment venue. Guest releases Venue and GlyphLock LLC from any and all claims arising from Guest's voluntary attendance and participation in VIP services.

10. DISPUTE RESOLUTION
Any dispute shall be resolved by binding arbitration in Maricopa County, Arizona under Arizona law. Guest waives any right to a jury trial and any right to bring claims as a class action.

BY SIGNING BELOW, GUEST ACKNOWLEDGES HAVING READ THIS ENTIRE AGREEMENT AND VOLUNTARILY AGREES TO BE LEGALLY BOUND BY ALL PROVISIONS.
`;

export const GLYPHBUCKS_PURCHASE_AGREEMENT = (venue, transaction) => `GLYPHBUCKS CLUB CURRENCY PURCHASE AGREEMENT

Transaction ID: ${transaction.uuid}
Venue: ${venue.name} | ${venue.address}
Date: ${transaction.timestamp}
Customer: ${transaction.customer_name}
Amount Paid: $${transaction.total}
Payment Method: ${transaction.payment_method}
Approval Code: ${transaction.approval_code}
GlyphBucks Issued: ${transaction.glyphbucks_serials}

NOTICE: GLYPHBUCKS ARE NON-REFUNDABLE ONCE ISSUED. BY SIGNING, YOU ACKNOWLEDGE RECEIPT AND AGREE TO ALL TERMS BELOW.

CUSTOMER ACKNOWLEDGMENTS

1. RECEIPT OF GLYPHBUCKS
Customer acknowledges receipt of the GlyphBucks listed above and confirms that the serial numbers listed accurately reflect the GlyphBucks delivered to Customer.

2. AUTHORIZED CARDHOLDER
Customer represents that Customer is the authorized holder of the payment method used and has authority to authorize the charge reflected herein.

3. ACCURACY OF INFORMATION
Customer represents that all information provided, including identity documents, is true, accurate, and complete. Misrepresentation constitutes fraud.

4. NON-REFUNDABLE PURCHASE
GlyphBucks are non-refundable once issued. Customer is not entitled to a refund of any amounts paid, whether GlyphBucks are used or unused, for any reason.

5. EXCLUSIVE VENUE USE
GlyphBucks may be used exclusively at ${venue.name} and have no cash value or exchange value outside the Premises. GlyphBucks may not be transferred, sold, or exchanged for cash under any circumstances.

6. EXPIRATION
GlyphBucks expire at the close of business on the date of issuance. Unused GlyphBucks are forfeited without compensation.

7. ANTI-CHARGEBACK COVENANT
Customer expressly covenants not to initiate, authorize, or cooperate with any chargeback, dispute, reversal, or claim with any bank, credit card company, or payment processor regarding this transaction. Customer acknowledges that GlyphBucks were received and that this purchase was entirely voluntary. Any chargeback constitutes breach of this Agreement. Customer shall be liable for the original transaction amount plus $500.00 per incident in liquidated damages, plus reasonable attorneys' fees and all costs of collection. Venue may report fraudulent chargebacks to law enforcement.

8. VOLUNTARY TRANSACTION
Customer represents that this transaction is entirely voluntary, that Customer has not been coerced, and that Customer has the legal capacity to enter this Agreement. Voluntary intoxication does not negate Customer's legal obligations hereunder.

9. TECHNOLOGY PLATFORM
GlyphLock LLC operates the technology platform facilitating this transaction and is not a party to any entertainment services rendered. GlyphLock LLC is not liable for any claims arising from entertainment services, venue operations, or entertainer conduct.

10. DISPUTE RESOLUTION
Any dispute shall be resolved by binding arbitration in Maricopa County, Arizona under Arizona law. Customer waives any right to a jury trial and any right to bring claims as part of a class action.

BY SIGNING BELOW, CUSTOMER ACKNOWLEDGES RECEIPT OF GLYPHBUCKS AND AGREES TO BE LEGALLY BOUND BY ALL TERMS ABOVE.
`;