/**
 * Print helpers. Pop-up blockers are a normal browser condition, so callers get
 * a result instead of an exception they cannot show to the operator.
 */
const PRINT_STYLES = `*{box-sizing:border-box;margin:0;padding:0;}
body{background:#fff;display:flex;justify-content:center;padding:.3in;}
@media print{body{padding:0;}@page{size:8.5in 11in;margin:0;}}`;

export function printNode(elementId, title) {
  const element = document.getElementById(elementId);
  if (!element) return { ok: false, reason: 'document_not_rendered' };

  const win = window.open('', '_blank', 'width=960,height=900');
  if (!win || win.closed || typeof win.document === 'undefined') {
    return { ok: false, reason: 'popup_blocked' };
  }

  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
<style>${PRINT_STYLES}</style></head><body>${element.outerHTML}
<script>window.onload=()=>{setTimeout(()=>window.print(),450);}<\/script></body></html>`);
  win.document.close();
  win.focus?.();
  return { ok: true };
}

export function printNodes(elementIds, title) {
  const parts = elementIds
    .map((id) => document.getElementById(id))
    .filter(Boolean)
    .map((element) => element.outerHTML);
  if (!parts.length) return { ok: false, reason: 'document_not_rendered' };

  const win = window.open('', '_blank', 'width=960,height=900');
  if (!win || win.closed || typeof win.document === 'undefined') {
    return { ok: false, reason: 'popup_blocked' };
  }

  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
<style>${PRINT_STYLES}body{display:block;padding:.2in;}
.check-page{page-break-after:always;}
@media print{@page{size:8.5in 11in;margin:0;}}</style></head>
<body>${parts.map((html) => `<div class="check-page">${html}</div>`).join('')}
<script>window.onload=()=>{setTimeout(()=>window.print(),500);}<\/script></body></html>`);
  win.document.close();
  win.focus?.();
  return { ok: true };
}