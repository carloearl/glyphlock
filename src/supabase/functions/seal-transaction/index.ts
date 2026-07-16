/**
 * seal-transaction — Supabase Edge Function (Deno)
 * ------------------------------------------------------------------
 * Server-side ONLY. Signs a GlyphBucks sale with the NUPS Ed25519
 * private key and returns the self-verifying token. The private key
 * never leaves the server.
 *
 * Secrets to set in Supabase:
 *   NUPS_ED25519_PRIVATE_PKCS8_B64  — base64 of the PKCS8 DER private key
 *   NUPS_ED25519_PUBLIC_B64URL      — base64url of the raw 32-byte public key (published)
 *
 * Generate a REAL keypair in your own secure environment (never reuse a
 * demo key). Example (Node):
 *   const {publicKey,privateKey}=require('crypto').generateKeyPairSync('ed25519');
 *   privateKey.export({type:'pkcs8',format:'der'}).toString('base64')          // -> PRIVATE secret
 *   publicKey.export({type:'spki',format:'der'}).subarray(-32).toString('base64url') // -> PUBLIC
 *
 * POST body: { sale: SaleInput, prevChainHash: string }
 * Returns:   { token, verifyRef, publicKeyB64u, sealedAtISO, termsHash, chainHash, prevBlock, thisBlock }
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const TERMS_VERSION = "NUPS-GBK-SVA-v2.0";

function b64uFromBytes(bytes: Uint8Array): string {
  let s = btoa(String.fromCharCode(...bytes));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function bytesFromB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function canonical(obj: Record<string, unknown>): string {
  const sorted: Record<string, unknown> = {};
  for (const k of Object.keys(obj).sort()) sorted[k] = obj[k];
  return JSON.stringify(sorted);
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("POST only", { status: 405 });

  const PRIV_B64 = Deno.env.get("NUPS_ED25519_PRIVATE_PKCS8_B64");
  const PUB_B64U = Deno.env.get("NUPS_ED25519_PUBLIC_B64URL");
  if (!PRIV_B64 || !PUB_B64U) return new Response("signing key not configured", { status: 500 });

  let body: any;
  try { body = await req.json(); } catch { return new Response("bad json", { status: 400 }); }
  const { sale, prevChainHash } = body ?? {};
  if (!sale) return new Response("missing sale", { status: 400 });

  // ---- GUARDRAILS (server-enforced) ----
  // The charge IS the GlyphBucks purchase. Reject any attempt to relabel it.
  if (sale.category && sale.category !== "STORED_VALUE")
    return new Response("category must be STORED_VALUE", { status: 422 });

  // derive figures
  const faceCents = Math.round(sale.denomCents * sale.qty);
  const cardFeeCents = Math.round(faceCents * (sale.cardFeeRatePct / 100));
  const amtCents = faceCents + cardFeeCents;

  // refs (replace with your sequence/ledger service)
  const stamp = new Date();
  const seq = (body.ledgerSeq ?? Date.now()).toString();
  const agreementNo = sale.agreementNo ?? `GBK-AGR-${stamp.toISOString().slice(2,10).replace(/-/g,"")}-${seq.slice(-6)}`;
  const verifyRef = sale.verifyRef ?? `VRF-${stamp.toISOString().slice(2,10).replace(/-/g,"")}-${seq.slice(-6)}-${crypto.getRandomValues(new Uint8Array(2)).reduce((a,b)=>a+b.toString(16).padStart(2,"0"),"").toUpperCase()}`;
  const sealedAtISO = stamp.toISOString();

  // hashes
  const termsText = `${TERMS_VERSION}|${sale.operator}|AZ-MARICOPA|stored-value-instrument|instrument-sale-only|non-refundable-44-7402|reserve-backed|FCBA-nonwaiver`;
  const termsHash = await sha256Hex(termsText);
  const prevBlock = prevChainHash ?? await sha256Hex("GENESIS");
  const chainHash = await sha256Hex(prevBlock + termsHash + agreementNo);

  // canonical payload (must match the client verifier's expectations)
  const payload = {
    v: "NUPS1", ref: verifyRef, iss: (sale.operator as string).toUpperCase(),
    doc: agreementNo, prod: "GlyphBucks stored-value",
    amt: amtCents, cur: sale.currency ?? "USD", face: faceCents,
    sn: `GB-${(sale.venueId||"LH").split("-")[0]}-0${sale.serialStart}..0${sale.serialStart + sale.qty - 1}`,
    acct: sale.gbAccountLast4, th: termsHash, ch: chainHash, ts: sealedAtISO,
  };
  const payloadB64u = b64uFromBytes(new TextEncoder().encode(canonical(payload)));
  const signingInput = new TextEncoder().encode("NUPS1." + payloadB64u);

  // import PKCS8 private key and sign
  const key = await crypto.subtle.importKey(
    "pkcs8", bytesFromB64(PRIV_B64), { name: "Ed25519" }, false, ["sign"]
  );
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, key, signingInput));
  const token = "NUPS1." + payloadB64u + "." + b64uFromBytes(sig);

  // NOTE: persist SealRecord/AssentEvidence/GlyphBucksSale + append-only ledger here,
  // recording GlyphBucks issuance as a LIABILITY (never revenue).

  return new Response(JSON.stringify({
    token, verifyRef, publicKeyB64u: PUB_B64U, sealedAtISO,
    termsHash, chainHash, prevBlock, thisBlock: `FOH-${seq.padStart(9,"0")}`,
  }), { headers: { "content-type": "application/json" } });
});