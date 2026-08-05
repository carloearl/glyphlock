/**
 * printHtml — reliable receipt printing.
 *
 * window.open() is blocked inside the app frame / kiosk fullscreen, which
 * silently killed receipt printing. Printing through a hidden same-document
 * iframe always works and needs no popup permission.
 */
export function printHtml(html, { title = "Receipt" } = {}) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  const cleanup = () => {
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 1000);
  };

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  doc.title = title;

  let printed = false;
  const run = () => {
    if (printed || !iframe.contentWindow) return;
    printed = true;
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } finally {
      cleanup();
    }
  };

  // Give the browser a tick to lay out the receipt before printing.
  if (iframe.contentWindow.document.readyState === "complete") {
    setTimeout(run, 250);
  } else {
    iframe.onload = () => setTimeout(run, 250);
    setTimeout(run, 800);
  }
}