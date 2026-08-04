// Liberty Entertainment dba Dream Palace — LEGACY "Dance Dollars" Agreement/Invoice.
// Kept VERBATIM as a separate instrument. This is NOT the GlyphBucks v3.1
// stored-value agreement (Venue Code header + A.R.S. § 44-7402 framing) and
// must never be merged with it — the two are distinct legal documents.

export const DD_VERSION = "legacy-dance-dollars-v1";

export const DD_HEADER = "Liberty Entertainment dba Dream Palace";
export const DD_TITLE = "AGREEMENT / INVOICE";

export const DD_FEE_LINES = [
  { label: "ROOM FEE", extra: "Gratuity", total: "AMOUNT" },
  { label: "TOTAL ROOM FEES", extra: "TOTAL Gratuity", total: "TOTAL AMOUNT" },
];

export const DD_FEE_SINGLES = [
  "Service Fee of 20%",
  "Additional Gratuity",
  "GRAND TOTAL DUE",
];

export const DD_RECEIPT_ACK =
  "CARD MEMBER ACKNOWLEDGES RECEIPT OF GOODS AND/OR SERVICES IN THE AMOUNT SHOWN HEREIN.";

export const DD_PREAMBLE =
  "The following constitutes the terms of this agreement in your purchase of Dance Dollars. This agreement affects your legal rights. You should read it carefully.";

export const DD_BODY =
  "You have agreed to authorize us to charge your credit card for all amounts listed on this statement. You hereby acknowledge receipt of the Dance Dollars purchased. Dance Dollars are not redeemable for cash. Dance Dollars may be used for: tipping, paying for table dances, or paying for entertainer's time. Dance Dollars may not be used for the purchase of drinks, food, merchandise, or for admission into the club. Dance Dollars are not legal tender. Dance Dollars are valid only on the day purchased and will expire at closing. Dance Dollars is a convenience provided to the patrons of our Cabaret. Our Cabaret is not responsible for any damages, including but not limited to consequential damages sustained by any party as the result of goods or services exchanges for Dance Dollars, except as to the damages expressly authorized by state law. You further acknowledge that this agreement is entered into voluntarily, free of any duress or coercion. You agree to pay the authorized amount in accordance with the terms as set forth by the credit card company. If for any reason the credit card company does not make payment on this account, you will owe such amount plus all reasonable costs of collection, including attorney fees, along with interest in the amount of 2% per month (ANNUAL RATE 24%), or the maximum allowed by law whichever is less. Said interest shall begin to accrue at the time of signing this agreement. In the event you dispute this charge, in addition to the aforementioned costs, you will also incur a liquidating damage penalty in the amount of $1,000.00, which represents administrative, as well as other expenses associated with handling such a dispute, all of which are difficult to ascertain with any amount of certainty. You expressly consent to the jurisdiction in the State of Arizona, including, but not limited to Maricopa County Superior Court. You further agree to contact our establishment regarding resolution of any dispute that arises under this agreement prior to utilizing other remedies which may be available to you. Failure to do so is hereby deemed lack of good faith and will likely result in increased collection costs, including attorney fees, which might otherwise be easily avoided. Our establishment does not make any representations or warranties with respect to services purchased from the entertainers. The entertainers are not employees of our establishment. The entertainers are independent contractors, any questions regarding the nature of content or their services should be discussed with the entertainer.";

export const DD_CLOSING =
  "All terms and conditions agreed to and I have taken possession of what I paid for, and agree that I'm responsible for the charges.";

export const DD_FINAL_SALE =
  "ALL SALES FINAL. NO REFUNDS. NO EXCHANGES. NO EXCEPTION.";

export const DD_SIGNATURE_FIELDS = [
  "CARD HOLDER'S NAME",
  "CARD HOLDER'S SIGNATURE",
  "DATE OF TRANSACTION",
];