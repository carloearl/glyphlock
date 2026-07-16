// GlyphBucks — seal-transaction (Supabase Edge Function, Deno)
// -----------------------------------------------------------------------------
// Server-side Ed25519 signing. The PRIVATE KEY NEVER LEAVES THIS FUNCTION.
//
// Secrets (Supabase → Edge Function secrets):
//   NUPS_ED25519_PRIVATE_PKCS8_B64  base64 of the PKCS#8 DER private key
//   NUPS_ED25519_PUBLIC_B64URL      base64url of the raw 32-byte public key (published)
//
// Guardrails enforced here:
//   1. Category MUST be STORED_VALUE — anything else is rejected (no wrapper MCC).
//   4. No performance/service line items are accepted.
//   5. Issuance is a liability, not revenue (the payload carries no revenue field).
//
// Request body: { sale: SaleInput, prevChainHash?: string }
// Response:     SealResult (see GlyphBucks.tsx)
// -----------------------------------------------------------------------------

const CATEGORY = "STORED_VALUE";

const CONTRACT_TERMS_TEXT = [
  "1. Stored-Value Instrument\nGlyphBucks are prepaid stored-value instruments issued by the venue. This agreement records the purchase of stored value only. It confers no goods, services, performance, or entertainment of any kind.",
  "2. Purchase, Not Deposit\nThe buyer purchases GlyphBucks at face value in the transaction category STORED_VALUE. The charge settled to the buyer's payment instrument is for the purchase of these stored-value instruments and nothing else.",
  "3. Redemption\nGlyphBucks are redeemable at the issuing venue in accordance with venue rules in effect at time of redemption. They are not legal tender and are not redeemable for cash except where required by law.",
  "4. No Performance or Service\nThis instrument does not represent, promise, or guarantee any performance, service, appearance, or outcome. No performance or service line item is part of this transaction.",
  "5. Segregated Reserve\nOutstanding stored value is backed by a segregated reserve account maintained by the issuer for the benefit of holders of outstanding value.",
  "6. Liability, Not Revenue\nIssuance of GlyphBucks creates a liability of the issuer to the holder. Issued value is not recognized as sales revenue and is excluded from total_sales until redeemed.",
  "7. Non-Transfer Restrictions\nTransfer, resale, or exchange of GlyphBucks is permitted only as expressly allowed by venue rules. Unauthorized transfer may void the instrument.",
  "8. Expiration and Fees\nAny expiration date or service fee applies only to the extent permitted by applicable state and federal law, including the CARD Act where applicable.",
  "9. Record Integrity\nThis record is sealed with an Ed25519 digital signature and a hash chain. The signature proves the record was not altered after issuance; it does not by itself make the underlying terms enforceable.",
  "10. Governing Law\nThis agreement is governed by the laws of the State of Arizona, including its treatment of stored-value instruments and the A.R.S. § 42-5061 tax position, subject to review by Arizona counsel.",
  "11. FCBA Non-Waiver (MANDATORY)\nNothing in this agreement waives, limits, or otherwise impairs the buyer's rights under the federal Fair Credit Billing Act (15 U.S.C. § 1666 et seq.) or the buyer's right to dispute a charge with the card issuer. Any dispute defense prepared by the issuer is representment evidence only and shall never be used to block, suppress, or discourage the buyer's issuer dispute path.",
].join("\n\n");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const enc = new TextEncoder();

function canonicalize(value: unknown): string {
  const norm = (v: any): any => {
    if (v === null || typeof v !== "object") return v;
    if (Array.isArray(v)) return v.map(norm);
    return Object.keys(v).sort().reduce((acc: Record<string, any>, k) => {
      acc[k] = norm(v[k]);
      return acc;
    }, {});
  };
  return JSON.stringify(norm(value));
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(input: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(input)));
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64uEncode(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const privB64 = Deno.env.get("NUPS_ED25519_PRIVATE_PKCS8_B64");
    const pubB64u = Deno.env.get("NUPS_ED25519_PUBLIC_B64URL");
    if (!privB64 || !pubB64u) {
      return Response.json(
        { error: "Signing keys not configured. Set NUPS_ED25519_PRIVATE_PKCS8_B64 and NUPS_ED25519_PUBLIC_B64URL." },
        { status: 500, headers: CORS },
      );
    }

    const { sale, prevChainHash = "GENESIS" } = await req.json();

    if (!sale || typeof sale !== "object") {
      return Response.json({ error: "Missing sale." }, { status: 400, headers: CORS });
    }

    // GUARDRAIL 1: real MCC only. Reject any non-STORED_VALUE category.
    if (sale.category && sale.category !== CATEGORY) {
      return Response.json(
        { error: `Rejected: category must be ${CATEGORY}. No wrapper category permitted.` },
        { status: 422, headers: CORS },
      );
    }

    const denominations = Array.isArray(sale.denominations) ? sale.denominations : [];
    const denomTotal = denominations.reduce(
      (s: number, d: any) => s + (Number(d.face) || 0) * (Number(d.count) || 0),
      0,
    );
    const amount = Number(sale.amount) || 0;
    if (amount <= 0 || denomTotal !== amount) {
      return Response.json(
        { error: "Amount must be positive and equal the sum of denominations." },
        { status: 422, headers: CORS },
      );
    }

    // GUARDRAIL 4: no performance/service framing — reject unexpected line items.
    if ("lineItems" in sale || "service" in sale || "performance" in sale) {
      return Response.json(
        { error: "Rejected: performance/service line items are not permitted." },
        { status: 422, headers: CORS },
      );
    }

    const mode = ["DEMO", "SANDBOX", "REAL"].includes(sale.mode) ? sale.mode : "DEMO";
    const issuedAt = new Date().toISOString();
    const serial = `GB-${String(sale.venueId || "VENUE").slice(0, 8).toUpperCase()}-${Date.now()}-${
      crypto.randomUUID().slice(0, 6)
    }`;
    const termsHash = await sha256Hex(CONTRACT_TERMS_TEXT);

    // Payload without the two derived hashes — that's what payloadHash covers.
    const core = {
      v: 1,
      serial,
      category: CATEGORY,
      venueId: sale.venueId || "VENUE",
      amount,
      denominations: denominations.map((d: any) => ({
        face: Number(d.face) || 0,
        count: Number(d.count) || 0,
      })),
      buyerRef: sale.buyerRef ?? null,
      cardBrand: sale.cardBrand ?? null,
      cardLast4: sale.cardLast4 ?? null,
      operatorId: sale.operatorId ?? null,
      issuedAt,
      mode,
      prevChainHash,
      termsHash,
    };

    const payloadHash = await sha256Hex(canonicalize(core));
    const chainHash = await sha256Hex(prevChainHash + payloadHash);
    const payload = { ...core, payloadHash, chainHash };

    // Sign the canonical payload bytes with Ed25519.
    const privKey = await crypto.subtle.importKey(
      "pkcs8",
      b64ToBytes(privB64),
      { name: "Ed25519" },
      false,
      ["sign"],
    );
    const payloadBytes = enc.encode(canonicalize(payload));
    const sigBuf = await crypto.subtle.sign({ name: "Ed25519" }, privKey, payloadBytes);

    const signatureB64u = b64uEncode(new Uint8Array(sigBuf));
    const payloadB64u = b64uEncode(payloadBytes);
    const qrText = `GB1.${payloadB64u}.${signatureB64u}`;

    const result = {
      serial,
      issuedAt,
      payload,
      payloadB64u,
      signatureB64u,
      publicKeyB64u: pubB64u,
      chainHash,
      prevChainHash,
      payloadHash,
      qrText,
      tsaToken: null, // RFC 3161 timestamp — wire a live TSA before REAL mode.
      mode,
    };

    return Response.json(result, { headers: CORS });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500, headers: CORS });
  }
});