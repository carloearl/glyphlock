export default function DreamPalacePrintLayout({
  orderNumber, customerName, customerId, customerAddress, customerState, customerZip,
  purchaserCardName, cardLastSix, cardExp, approvalCode, managerName, hostessName,
  lineItems, dreamDollarValue, surcharge, grandTotal, signature, managerSig, hostessSig,
}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US');
  const lineTotal = lineItems.reduce((s, li) => s + (li.amount || 0), 0);

  return `<html><head><title>Dream Palace - ${orderNumber}</title>
<style>
  @media print { @page { margin: 15mm; } }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; line-height: 1.4; padding: 20px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 16px; text-align: center; margin-bottom: 2px; }
  h2 { font-size: 12px; text-align: center; margin-bottom: 12px; }
  .box { border: 1px solid #000; padding: 6px; margin-bottom: 8px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
  .label { font-weight: bold; color: #c00; font-size: 10px; }
  .label-yellow { font-weight: bold; color: #c90; font-size: 10px; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0; }
  th, td { border: 1px solid #000; padding: 3px 6px; font-size: 10px; }
  th { background: #f5f5f5; }
  .warning { color: #c00; font-weight: bold; text-align: center; font-size: 11px; margin: 6px 0; }
  .sig-line { border-bottom: 1px solid #000; min-height: 30px; margin: 4px 0; padding: 4px; font-family: cursive; font-size: 14px; }
  .sig-label { font-size: 9px; color: #666; }
  .footer { text-align: center; margin-top: 16px; font-size: 8px; color: #666; border-top: 1px solid #000; padding-top: 6px; }
  .thumb-box { border: 1px solid #000; width: 120px; height: 80px; display: inline-block; }
</style></head><body>
  <h1>Dream Palace</h1>
  <h2>Sales / Order receipt Form</h2>

  <div class="grid2">
    <div class="box">
      <div style="font-weight:bold;margin-bottom:4px;">Customer / Purchaser</div>
      <div><span class="label">Name:</span> ${customerName}</div>
      <div><span class="label">ID#:</span> ${customerId || ''}</div>
      <div><span class="label">Address:</span> ${customerAddress || ''}</div>
      <div><span class="label">State:</span> ${customerState || ''} <span class="label">Zip:</span> ${customerZip || ''}</div>
    </div>
    <div class="box">
      <div style="font-weight:bold;margin-bottom:4px;">Purchaser Card Info.</div>
      <div><span class="label-yellow">Name:</span> ${purchaserCardName}</div>
      <div><span class="label-yellow">Card Number:</span></div>
      <div>Last 6 #s: ${cardLastSix || ''}</div>
      <div><span class="label-yellow">EXP:</span> ${cardExp || ''} <span class="label-yellow" style="margin-left:20px;">CCV#:</span> ***</div>
      <div><span class="label-yellow">Approval Code:</span> ${approvalCode || ''}</div>
      <div>Manager: ${managerName || ''} &nbsp;&nbsp; Hostess: ${hostessName || ''}</div>
    </div>
  </div>

  <div class="warning">Dream Dollars (Club Currency) are not legal tender</div>

  <table>
    <thead>
      <tr><th>#</th><th>RM# / ENT. / Dur. / ENT Cub ID#</th><th>Room Fee</th><th>+</th><th>Product</th><th>+</th><th>Amount</th></tr>
    </thead>
    <tbody>
      ${lineItems.map(li => `<tr>
        <td>${li.line_number}</td>
        <td>${li.room_ent_dur_id || ''}</td>
        <td style="text-align:right">${li.room_fee ? '$' + li.room_fee.toFixed(2) : ''}</td>
        <td style="text-align:center">+</td>
        <td style="text-align:right">${li.product ? '$' + li.product.toFixed(2) : ''}</td>
        <td style="text-align:center">+</td>
        <td style="text-align:right">${li.amount ? '$' + li.amount.toFixed(2) : ''}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="box">
    <div class="grid2">
      <div>
        <div><strong>Dream Dollar value (Amount Ordered)</strong></div>
        <div><strong>Processing Surcharge 30% for issuing Dream Dollars</strong></div>
        <div style="font-size:8px;margin-top:4px;">** Dream Dollar are sold as a Convenience medium of currency for payment and is not valid anywhere else. The Entertainer can redeem the Dream Dollars for Cash.</div>
      </div>
      <div style="text-align:right;">
        <div>Dream Dollars: <strong>$${dreamDollarValue.toFixed(2)}</strong> +</div>
        <div>Surcharge: <strong>$${surcharge.toFixed(2)}</strong> +</div>
        <div style="font-size:10px;margin-top:4px;">Not Legal Tender</div>
        <div style="border:2px solid #000;padding:6px;margin-top:6px;font-weight:bold;font-size:14px;">
          GRAND TOTAL CHARGE = <strong>$${grandTotal.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  </div>

  <div style="text-align:center;font-weight:bold;text-decoration:underline;margin:8px 0;">Acknowledgements</div>
  <ul style="font-size:9px;padding-left:16px;">
    <li>You have read and understand this Order (front & back).</li>
    <li>You confirm the information in this Order is true and correct.</li>
    <li>You are the authorized signer for the credit card identified in this Order.</li>
    <li>If you do not pay amounts due under this Order, you consent to use of information gathered about you for collection.</li>
    <li>You have received the non-refundable Club Currency listed in this Order.</li>
    <li><strong>You have read and understood the Terms and Conditions on the front and back side of this contract. And Agree.</strong></li>
  </ul>

  <div style="margin-top:16px;">
    <div class="grid2">
      <div>
        <div style="font-weight:bold;margin-bottom:4px;">Customer Signature:</div>
        <div class="sig-line">${signature}</div>
        <div class="sig-label">Date: ${dateStr}</div>
      </div>
      <div>
        <div style="font-weight:bold;margin-bottom:4px;">Thumb Print</div>
        <div class="thumb-box"></div>
      </div>
    </div>
  </div>

  <div style="margin-top:12px;" class="grid2">
    <div>
      <div style="font-weight:bold;">Manager Signature:</div>
      <div class="sig-line">${managerSig}</div>
    </div>
    <div>
      <div style="font-weight:bold;">Hostess Signature:</div>
      <div class="sig-line">${hostessSig}</div>
    </div>
  </div>

  <div class="footer">
    Dream Palace — Sales / Order Receipt | Order#: ${orderNumber} | Date: ${dateStr}<br/>
    DD form Digital Version v3 — 02-06-2026 | N.U.P.S. Point-of-Sale System<br/>
    Retain for records. More Terms and Conditions on the back of this order. You Acknowledge Receiving Dream Dollars.
  </div>
</body></html>`;
}