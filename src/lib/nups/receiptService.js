import { getNupsEnvironment, getNupsEnvironmentPolicy } from '@/lib/nups/operatingEnvironment';

const LAST_RECEIPT_KEY = 'nups:last-printable-receipt';
const RECEIPT_EVENT = 'nups:receipt-ready';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function formatReceiptMoney(cents, currency = 'USD') {
  const amount = Number(cents || 0) / 100;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function normalizeLine(line, index) {
  const quantity = Math.max(1, Number(line?.quantity) || 1);
  const unitPriceCents = Number(line?.unit_price_cents ?? line?.unitPriceCents ?? line?.price_cents ?? 0) || 0;
  const totalCents = Number(line?.total_cents ?? line?.totalCents ?? quantity * unitPriceCents) || 0;
  return {
    id: line?.id || `line-${index + 1}`,
    label: String(line?.label || line?.name || line?.item || line?.title || 'Item'),
    quantity,
    unit_price_cents: unitPriceCents,
    total_cents: totalCents,
  };
}

export function normalizeReceipt(receipt = {}) {
  const lines = Array.isArray(receipt.lines)
    ? receipt.lines.map(normalizeLine)
    : receipt.item
      ? [normalizeLine(receipt, 0)]
      : [];
  const subtotal = Number(receipt.subtotal_cents ?? receipt.subtotalCents ?? lines.reduce((sum, line) => sum + line.total_cents, 0)) || 0;
  const tax = Number(receipt.tax_cents ?? receipt.taxCents ?? 0) || 0;
  const fees = Number(receipt.fee_cents ?? receipt.fees_cents ?? receipt.feeCents ?? 0) || 0;
  const discount = Number(receipt.discount_cents ?? receipt.discountCents ?? 0) || 0;
  const total = Number(receipt.total_cents ?? receipt.totalCents ?? subtotal + tax + fees - discount) || 0;
  const environment = String(receipt.environment || getNupsEnvironment()).toUpperCase();

  return {
    id: receipt.id || receipt.transaction_id || receipt.receipt_number || `receipt-${Date.now()}`,
    receipt_number: receipt.receipt_number || receipt.receiptNumber || receipt.number || 'NUPS RECEIPT',
    venue_name: receipt.venue_name || receipt.venueName || receipt.venue?.name || 'NUPS Venue',
    venue_address: receipt.venue_address || receipt.venueAddress || receipt.venue?.address || '',
    operator_name: receipt.operator_name || receipt.operatorName || receipt.cashier || '',
    created_at: receipt.created_at || receipt.createdAt || new Date().toISOString(),
    payment_method: receipt.payment_method || receipt.paymentMethod || '',
    currency: receipt.currency || 'USD',
    lines,
    subtotal_cents: subtotal,
    tax_cents: tax,
    fees_cents: fees,
    discount_cents: discount,
    total_cents: total,
    environment,
    notes: receipt.notes || '',
    metadata: receipt.metadata || {},
  };
}

export function saveLastReceipt(receipt) {
  const normalized = normalizeReceipt(receipt);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LAST_RECEIPT_KEY, JSON.stringify(normalized));
      window.dispatchEvent(new CustomEvent(RECEIPT_EVENT, { detail: normalized }));
    } catch {
      // Printing still works even when storage is unavailable.
    }
  }
  return normalized;
}

export function getLastReceipt() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LAST_RECEIPT_KEY);
    return raw ? normalizeReceipt(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function subscribeToReceiptReady(callback) {
  if (typeof window === 'undefined') return () => {};
  const listener = (event) => callback(event?.detail || getLastReceipt());
  window.addEventListener(RECEIPT_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(RECEIPT_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}

function receiptDocument(receipt, { autoPrint = true } = {}) {
  const r = normalizeReceipt(receipt);
  const policy = getNupsEnvironmentPolicy(r.environment);
  const watermark = policy.watermark || r.environment !== 'LIVE'
    ? `<div class="watermark">${escapeHtml(r.environment)} · NOT A LIVE FINANCIAL RECORD</div>`
    : '';
  const lineRows = r.lines.length
    ? r.lines.map((line) => `
      <tr>
        <td><strong>${escapeHtml(line.label)}</strong><div class="muted">${line.quantity} × ${formatReceiptMoney(line.unit_price_cents, r.currency)}</div></td>
        <td class="money">${formatReceiptMoney(line.total_cents, r.currency)}</td>
      </tr>`).join('')
    : '<tr><td colspan="2" class="muted">No item lines recorded.</td></tr>';

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(r.receipt_number)}</title>
<style>
  @page { size: 80mm auto; margin: 7mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #050505; background: #fff; }
  .receipt { width: 100%; max-width: 80mm; margin: 0 auto; position: relative; }
  .brand { text-align: center; font-weight: 900; letter-spacing: .16em; font-size: 17px; }
  .venue { text-align: center; margin-top: 6px; font-size: 12px; }
  .rule { border-top: 1px dashed #111; margin: 12px 0; }
  .meta { font-size: 10px; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  td { padding: 6px 0; vertical-align: top; border-bottom: 1px dotted #bbb; }
  .money { text-align: right; white-space: nowrap; }
  .muted { color: #555; font-size: 9px; margin-top: 2px; }
  .totals { margin-top: 10px; font-size: 11px; }
  .total-row { display: flex; justify-content: space-between; padding: 3px 0; }
  .grand { font-size: 16px; font-weight: 900; border-top: 2px solid #111; margin-top: 5px; padding-top: 8px; }
  .footer { text-align: center; font-size: 9px; line-height: 1.5; margin-top: 15px; }
  .watermark { border: 2px solid #111; padding: 8px; text-align: center; font-weight: 900; font-size: 10px; margin: 10px 0; }
  .no-print { display: flex; gap: 8px; justify-content: center; margin: 18px 0; }
  button { font: inherit; padding: 8px 12px; border: 1px solid #111; background: #fff; cursor: pointer; }
  @media print { .no-print { display: none !important; } }
</style>
</head>
<body>
  <main class="receipt">
    <div class="brand">GLYPHLOCK · NUPS</div>
    <div class="venue"><strong>${escapeHtml(r.venue_name)}</strong>${r.venue_address ? `<br />${escapeHtml(r.venue_address)}` : ''}</div>
    ${watermark}
    <div class="rule"></div>
    <div class="meta">
      <div>Receipt: ${escapeHtml(r.receipt_number)}</div>
      <div>Date: ${escapeHtml(new Date(r.created_at).toLocaleString())}</div>
      ${r.operator_name ? `<div>Operator: ${escapeHtml(r.operator_name)}</div>` : ''}
      ${r.payment_method ? `<div>Payment: ${escapeHtml(r.payment_method)}</div>` : ''}
    </div>
    <div class="rule"></div>
    <table><tbody>${lineRows}</tbody></table>
    <div class="totals">
      <div class="total-row"><span>Subtotal</span><span>${formatReceiptMoney(r.subtotal_cents, r.currency)}</span></div>
      ${r.tax_cents ? `<div class="total-row"><span>Tax</span><span>${formatReceiptMoney(r.tax_cents, r.currency)}</span></div>` : ''}
      ${r.fees_cents ? `<div class="total-row"><span>Fees</span><span>${formatReceiptMoney(r.fees_cents, r.currency)}</span></div>` : ''}
      ${r.discount_cents ? `<div class="total-row"><span>Discount</span><span>-${formatReceiptMoney(r.discount_cents, r.currency)}</span></div>` : ''}
      <div class="total-row grand"><span>TOTAL</span><span>${formatReceiptMoney(r.total_cents, r.currency)}</span></div>
    </div>
    ${r.notes ? `<div class="rule"></div><div class="meta">${escapeHtml(r.notes)}</div>` : ''}
    <div class="footer">Generated by NUPS<br />Build · Verify · Operate</div>
    <div class="no-print">
      <button onclick="window.print()">Print</button>
      <button onclick="window.close()">Close</button>
    </div>
  </main>
  ${autoPrint ? '<script>window.addEventListener("load",()=>setTimeout(()=>window.print(),250));</script>' : ''}
</body>
</html>`;
}

export function printNupsReceipt(receipt, options = {}) {
  const normalized = saveLastReceipt(receipt);
  if (typeof window === 'undefined') return { ok: false, reason: 'Printing requires a browser.' };

  const popup = window.open('', '_blank', 'noopener,noreferrer,width=480,height=760');
  if (!popup) {
    downloadReceiptHtml(normalized);
    return { ok: false, fallback: 'download', reason: 'Pop-up blocked. A printable receipt file was downloaded instead.' };
  }

  popup.document.open();
  popup.document.write(receiptDocument(normalized, options));
  popup.document.close();
  return { ok: true, receipt: normalized };
}

export function downloadReceiptHtml(receipt) {
  if (typeof window === 'undefined') return false;
  const normalized = normalizeReceipt(receipt);
  const blob = new Blob([receiptDocument(normalized, { autoPrint: false })], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${String(normalized.receipt_number || 'nups-receipt').replace(/[^a-z0-9_-]+/gi, '-')}.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

export function printCurrentNupsView({ title = document?.title || 'NUPS', selector = null } = {}) {
  if (typeof window === 'undefined') return { ok: false, reason: 'Printing requires a browser.' };
  const element = selector
    ? document.querySelector(selector)
    : document.querySelector('[data-nups-receipt], [data-receipt], .nups-receipt, main') || document.body;
  if (!element) return { ok: false, reason: 'No printable content was found.' };

  const popup = window.open('', '_blank', 'noopener,noreferrer,width=900,height=760');
  if (!popup) {
    window.print();
    return { ok: false, fallback: 'browser-print', reason: 'Pop-up blocked; using browser print.' };
  }

  const environment = getNupsEnvironment();
  const cloned = element.cloneNode(true);
  cloned.querySelectorAll('button, input, select, textarea, [data-no-print]').forEach((node) => node.remove());
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:Inter,Arial,sans-serif;margin:24px;color:#111;background:white}img{max-width:100%}.nups-print-watermark{padding:10px;border:2px solid #111;text-align:center;font-weight:900;margin-bottom:16px}@media print{button{display:none}}</style></head><body>${environment !== 'LIVE' ? `<div class="nups-print-watermark">${escapeHtml(environment)} · NOT A LIVE RECORD</div>` : ''}${cloned.outerHTML}<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));</script></body></html>`);
  popup.document.close();
  return { ok: true };
}

export const NUPS_RECEIPT_READY_EVENT = RECEIPT_EVENT;
