import React from "react";
import { useParams } from "react-router-dom";
import GlyphBucksVerify from "./GlyphBucksVerify";
import VIPShowVerify from "./VIPShowVerify";

/** /v/:ref — VRF-… refs verify GlyphBucks stored-value seals; all others are VIP Show contracts. */
export default function VerifyDispatch() {
  const { ref } = useParams();
  return String(ref || "").toUpperCase().startsWith("VRF-") ? <GlyphBucksVerify /> : <VIPShowVerify />;
}