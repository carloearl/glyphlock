/**
 * printHtml — reliable in-app browser printing.
 *
 * Two strategies:
 *  • iframe  — same-origin hidden iframe (best for top-level kiosk windows,
 *              no popup permission needed).
 *  • popup   — dedicated print window (required when the app itself runs
 *              inside an embedding iframe, e.g. previews/portals, where
 *              sandboxing silently ignores iframe print() calls).
 *
 * When embedded we lead with the popup; each strategy falls back to the other
 * so the operator always gets a print dialog if the browser allows one.
 */

const isEmbedded = () => {
  try { return window.self !== window.top; } catch { return true; }
};

function printViaPopup(html, title) {
  return new Promise((resolve, reject) => {
    const win = window.open('', '_blank', 'width=420,height=640');
    if (!win) {
      reject(new Error('Print window was blocked. Allow pop-ups for this site and try again.'));
      return;
    }
    try {
      win.document.open();
      win.document.write(String(html));
      win.document.close();
      win.document.title = title;
      // Give the layout a beat, then invoke print in the top-level window.
      setTimeout(() => {
        try {
          win.focus();
          win.print();
          resolve({
            ok: true,
            method: 'popup',
            dialogOpened: true,
            invokedAt: new Date().toISOString(),
          });
          // Close the helper window after printing where the browser allows it.
          try {
            win.addEventListener?.('afterprint', () => { try { win.close(); } catch (_) { /* noop */ } }, { once: true });
          } catch (_) { /* noop */ }
        } catch (error) {
          try { win.close(); } catch (_) { /* noop */ }
          reject(error instanceof Error ? error : new Error(String(error || 'Print failed')));
        }
      }, 350);
    } catch (error) {
      try { win.close(); } catch (_) { /* noop */ }
      reject(error instanceof Error ? error : new Error(String(error || 'Print failed')));
    }
  });
}

function printViaIframe(html, { title, layoutDelayMs, timeoutMs }) {
  return new Promise((resolve, reject) => {
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

export async function printHtml(html, {
  title = 'Receipt',
  layoutDelayMs = 250,
  timeoutMs = 5000,
} = {}) {
  if (typeof document === 'undefined' || !document.body) {
    throw new Error('Printing is unavailable outside a browser document.');
  }
  if (!String(html || '').trim()) {
    throw new Error('Nothing to print.');
  }

  const iframeOpts = { title, layoutDelayMs, timeoutMs };

  if (isEmbedded()) {
    // Embedded shells (preview iframes, portals) silently ignore iframe
    // print() — a dedicated window is the only reliable path.
    try {
      return await printViaPopup(html, title);
    } catch (popupError) {
      // Popup blocked — try the iframe anyway as a last resort.
      try {
        return await printViaIframe(html, iframeOpts);
      } catch (_) {
        throw popupError;
      }
    }
  }

  try {
    return await printViaIframe(html, iframeOpts);
  } catch (_) {
    return await printViaPopup(html, title);
  }
}