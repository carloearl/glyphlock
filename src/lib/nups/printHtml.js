/**
 * printHtml — reliable in-app browser printing.
 *
 * Uses a same-origin hidden iframe so kiosk/fullscreen deployments do not
 * depend on popup permissions. The returned promise confirms that the browser
 * print dialog was invoked; browsers do not expose whether the user physically
 * completed or cancelled the print.
 */
export function printHtml(html, {
  title = 'Receipt',
  layoutDelayMs = 250,
  timeoutMs = 5000,
} = {}) {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined' || !document.body) {
      reject(new Error('Printing is unavailable outside a browser document.'));
      return;
    }
    if (!String(html || '').trim()) {
      reject(new Error('Nothing to print.'));
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('title', `${title} print frame`);
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;';
    document.body.appendChild(iframe);

    let settled = false;
    let invoked = false;
    let timeoutId = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      setTimeout(() => {
        try { iframe.remove(); } catch (_) { /* already removed */ }
      }, 750);
    };

    const finish = (result) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const fail = (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error instanceof Error ? error : new Error(String(error || 'Print failed')));
    };

    const run = () => {
      if (invoked || settled) return;
      const frameWindow = iframe.contentWindow;
      if (!frameWindow) {
        fail(new Error('Print frame could not be initialized.'));
        return;
      }
      invoked = true;
      try {
        frameWindow.focus();
        const afterPrint = () => finish({
          ok: true,
          method: 'iframe',
          dialogOpened: true,
          afterPrintObserved: true,
          invokedAt: new Date().toISOString(),
        });
        frameWindow.addEventListener?.('afterprint', afterPrint, { once: true });
        frameWindow.print();

        // Safari and some kiosk shells do not fire afterprint. Resolve after
        // invocation so the operator is never left on a permanent spinner.
        setTimeout(() => finish({
          ok: true,
          method: 'iframe',
          dialogOpened: true,
          afterPrintObserved: false,
          invokedAt: new Date().toISOString(),
        }), 1200);
      } catch (error) {
        fail(error);
      }
    };

    timeoutId = setTimeout(() => fail(new Error('Print frame timed out before the dialog opened.')), timeoutMs);

    try {
      const frameWindow = iframe.contentWindow;
      const frameDocument = frameWindow?.document;
      if (!frameDocument) throw new Error('Print frame document is unavailable.');
      frameDocument.open();
      frameDocument.write(String(html));
      frameDocument.close();
      frameDocument.title = title;

      if (frameDocument.readyState === 'complete') {
        setTimeout(run, layoutDelayMs);
      } else {
        iframe.onload = () => setTimeout(run, layoutDelayMs);
        setTimeout(run, Math.min(timeoutMs - 500, 900));
      }
    } catch (error) {
      fail(error);
    }
  });
}
