import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, ArrowRight } from "lucide-react";

const ACKNOWLEDGMENTS = [
  "You have read and understand this Order (front & back).",
  "You confirm the information in this Order is true and correct.",
  "You are the authorized signer for the credit card identified in this Order.",
  "If you do not pay amounts due under this Order, you consent to use of information gathered about you for collection.",
  "You have received the non-refundable Club Currency listed in this Order. They may be used only at the Club. Once used, they are of no further value. They expire as specified on their face. Entertainers receive 50% of the face value of Club Currency. Entertainers redeem the Club Currency bills at 50% of face value. You agree it is fair and reasonable considering the amount of risk involved. For every two dollars in Club Currency redeemed the Entertainer is paid out 1 U.S. Dollar.",
  "You have read and understood the Terms and Conditions on the front and back side of this contract. And Agree."
];

const buildContractSections = (venueName, venueAddress, venuePhone, currencyName) => `1. Orders
${venueName} ("we," "our," or "us"), agrees to provide you ("you" or "your"), the customer named in the attached Order / purchase invoice (the "Order"), with the services, and products ("Services and Products") listed in the Order. ${currencyName} (Club currency). The independent entertainer contractors ("Entertainers") at our ${venueName}${venueAddress ? ' located at ' + venueAddress : ''} ("Club/Bar"), are independent entertainer contractors and are not our employees. You may independently arrange with Entertainers for services not provided by us, provided those services are legal. Entertainers do not have authority to contract for or bind us in any manner.

2. Payment
The fees for Services and Products ("Fees") are outlined in the Order and are due in full immediately upon your signature. You authorize us to process payment for the total Fees and any other amounts owed under these Terms and Conditions to the credit card identified in the Order ("Card"). To the fullest extent permitted by law, you irrevocably waive the right to dispute any charge for Services or Products consistent with the Order by requesting a chargeback or otherwise. You may not withhold or reverse payment on the Card for any reason, including setoffs related to disputes or claims against us. If you dispute a charge or attempt to withhold or reverse payment, we are entitled to charge an additional $50 fee for our operational costs, which may be applied to your Card.
If you fail to pay any amounts when due. Late payments will accrue interest at 2% per month, or the maximum allowed by law, whichever is less. You are responsible for all expenses we incur, including reasonable attorneys' fees and internal costs, in collecting late payments. You also expressly consent to our use of information about you, including photos, videos, images, and statements made at the Club, to the extent necessary to collect amounts owed under this Agreement.

3. Limitation of Liability
IN NO EVENT SHALL WE BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY CONSEQUENTIAL, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES, WHETHER ARISING OUT OF BREACH OF CONTRACT, TORT (INCLUDING NEGLIGENCE), OR OTHERWISE, REGARDLESS OF FORESEEABILITY AND WHETHER OR NOT WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT SHALL NOT EXCEED THE TOTAL AMOUNTS PAID TO US FOR THE SERVICES AND PRODUCTS SOLD HEREUNDER.

4. Club Currency Policy
${currencyName} is to be used exclusively for legal purposes within the Club/Bar and is of no value outside of these premises. It must not be used for illegal acts; if such use is detected, the ${currencyName} will be forfeited to the company.${venuePhone ? ' Refunds for ' + currencyName + ' are managed through the Club/Bar Management Office at ' + venuePhone + '.' : ''}

5. Disputes
Any dispute, controversy, or claim arising out of or relating to this Agreement will be resolved exclusively as follows:
• A party must send a written Dispute Notice to the other party${venuePhone ? ' or contact the Club Management office at ' + venuePhone : ''}. Before trying to initiate a chargeback with your card provider.
• Both parties will then attempt in good faith to resolve the Dispute through negotiation and consultation ("Negotiation").
• If the Dispute is not resolved within 30 days of delivery of the Dispute Notice, either party may submit the Dispute to a mutually agreed mediation service, providing a joint written request for mediation ("Mediation"). Both parties will cooperate in selecting a mediation service, choosing a neutral mediator, and scheduling the Mediation. They will then attempt in good faith to resolve the Dispute through Mediation.
• If the Dispute is not resolved within 90 days after submission to Mediation, either party may initiate litigation in a court of competent jurisdiction ("Litigation"). All Litigation must be instituted in the federal courts of the United States or the courts of the State of Arizona located in Maricopa County, and each party irrevocably submits to the exclusive jurisdiction of these courts.
• Each party irrevocably and unconditionally waives any right to a trial by jury or to participate in a class or representative action with respect to any Litigation.
• The prevailing party in any Litigation is entitled to recover all costs incurred, including reasonable attorneys' fees, expenses, court costs, and allocated internal costs. Additionally, before initiating Litigation, you must provide a bond of at least $50,000 from a company reasonably acceptable to us, to secure recovery of Litigation costs as provided under this Agreement.

6. Miscellaneous
All matters arising from or relating to this Agreement are governed by the internal laws of the State of Arizona, without regard to any choice of conflict of law provisions. If any term or provision is found to be invalid, illegal, or unenforceable in any jurisdiction, such finding will not affect the remaining terms or invalidate the provision in other jurisdictions. No waiver of any provision is effective unless in writing and signed by the waiving party. Failure or delay in exercising any right does not constitute a waiver. Single or partial exercise of any right does not preclude further exercise of that or any other right. Amendments or modifications to this Agreement must be in writing and signed by both you and our authorized representative. Provisions intended to survive termination, or expiration will remain in force as required. This Agreement, composed of the Order and these Terms and Conditions, constitutes the sole and entire agreement between the parties and supersedes all prior agreements, understandings, and representations regarding the subject matter.

7. Club Currency Restrictions, Valuation, and Use Policy
At ${venueName}, all parties—including purchasers, staff, and independent entertainers—are fully informed about the valuation and use of ${currencyName} prior to any transaction. The redeemable value of ${currencyName} is set at 50% of its face value, ensuring transparency whether the currency is purchased, used for compensation, given as a tip, or presented as a gift. This policy is disclosed up front to all parties.
${currencyName} is purchased with the clear understanding that its cash-out value equals 50% of its face denomination. When ${currencyName} is redeemed or exchanged for U.S. currency, the presenter receives 50% of the bill's denomination; the remaining 50% is retained by ${venueName} as a convenience fee. The direct exchange rate is one U.S. dollar for every two dollars of ${currencyName} face value. For every two dollars in face value per bill presented, the Club/Bar will pay out one U.S. dollar in value. All payouts are tracked and reported.
${currencyName} is a convenience product for use on premises to pay for club/bar services, products, and to compensate Non-employee entertainers for performances, time spent, or to show appreciation for their beauty.
It is not to be used for illegal activities or purposes; if such use is detected, the ${currencyName} will be forfeited. Each bill is issued with an expiration date, after which it has no value and cannot be refunded, exchanged, or converted. The value of expired ${currencyName} is transferred to the Club/Bar's Expired Club Currency Revenue Ledger Account.
By signing below, you acknowledge that you have read and agreed to these Terms and Conditions on both sides of this contract, and that you are entering into this agreement voluntarily, without duress or coercion, and not under the influence of any substance. You agree to be responsible for your purchase made by credit or debit card, and if your provider fails to honor payment, you will personally provide immediate payment of any amount not honored by your card provider.
You are purchasing ${currencyName} along with other products and services. ${currencyName} is for use as an alternative form of payment while at the ${venueName}. When you have spent them or otherwise used them, the ${currencyName} have functioned correctly and have used them for your benefit. Any Attempt to avoid your responsibility to pay for your purchase will be in bad faith and considered an attempt to commit fraud against Club/Bar.`;

export default function VenueContractText({ acks, setAcks, allAcked, onBack, onNext, venue = null }) {
  const venueName = venue?.name || 'The Venue';
  const venueAddress = [venue?.address, venue?.city, venue?.state].filter(Boolean).join(', ') || '';
  const venuePhone = venue?.phone || '';
  const currencyName = venue?.currency_name || 'Club Currency';
  const contractSections = buildContractSections(venueName, venueAddress, venuePhone, currencyName);

  return (
    <Card className="bg-gray-900/60 border-amber-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-400">
          <FileText className="w-5 h-5" /> Terms & Conditions — READ CAREFULLY
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-300">
          <p className="font-bold">⚠️ LEGAL DOCUMENT — By signing you agree to ALL terms below.</p>
        </div>

        <div className="bg-black/60 border border-gray-700 rounded-lg p-4 max-h-[400px] overflow-y-auto text-xs text-gray-300 whitespace-pre-wrap leading-relaxed font-mono">
          {contractSections}
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-bold text-white underline text-center">Acknowledgements</h4>
          {ACKNOWLEDGMENTS.map((text, i) => {
            const key = `ack${i+1}`;
            const checked = acks[key];
            const setter = setAcks[`setAck${i+1}`];
            return (
              <div key={i} className="flex items-start gap-3 cursor-pointer" onClick={() => setter(!checked)}>
                <Checkbox checked={checked} onCheckedChange={setter} className="mt-0.5" />
                <span className="text-xs text-gray-300 leading-relaxed">• {text}</span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1 border-gray-700">← Back</Button>
          <Button onClick={onNext} disabled={!allAcked} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold h-12">
            I Agree — Proceed to Sign <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}