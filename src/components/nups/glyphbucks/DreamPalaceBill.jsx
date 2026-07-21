import React from "react";
import Code128 from "./Code128";

/**
 * One Dream Palace VIP GlyphBucks bill = the uploaded artwork with the serial,
 * denomination, and a scannable Code-128 barcode overlaid onto the blank boxes.
 *
 * Overlay coordinates are percentages of the single-bill artwork, tuned to the
 * Dream Palace template (tall serial box top-left, denomination box right,
 * miscellaneous box below it, wide barcode strip along the bottom-center).
 */
export default function DreamPalaceBill({
  artworkUrl,
  serial,
  denomination,
  miscellaneous = "",
  aspectRatio = "745 / 210",
}) {
  return (
    <div
      className="dp-bill relative w-full overflow-hidden"
      style={{ aspectRatio, background: "#0a0a0a" }}
    >
      {artworkUrl ? (
        <img
          src={artworkUrl}
          alt="Dream Palace VIP GlyphBucks bill"
          className="absolute inset-0 w-full h-full object-fill"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs">
          Upload single-bill artwork
        </div>
      )}

      {/* SERIAL — vertical, in the tall top-left box */}
      <div
        className="absolute flex items-center justify-center"
        style={{ left: "3.2%", top: "8%", width: "10%", height: "84%" }}
      >
        <span
          style={{
            transform: "rotate(-90deg)",
            whiteSpace: "nowrap",
            fontFamily: "'Courier New', monospace",
            fontWeight: 700,
            color: "#1a1206",
            fontSize: "clamp(7px, 1.3vw, 13px)",
            letterSpacing: "1px",
          }}
        >
          {serial || "SERIAL"}
        </span>
      </div>

      {/* DENOMINATION — right-side box */}
      <div
        className="absolute flex items-center justify-center"
        style={{ left: "82.5%", top: "10.5%", width: "13.5%", height: "24%" }}
      >
        <span
          style={{
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            color: "#1a1206",
            fontSize: "clamp(12px, 3vw, 30px)",
            lineHeight: 1,
          }}
        >
          {denomination != null ? `$${denomination}` : "$—"}
        </span>
      </div>

      {/* MISCELLANEOUS — smaller right box below denomination */}
      <div
        className="absolute flex items-center justify-center px-1"
        style={{ left: "82.5%", top: "62%", width: "13.5%", height: "20%" }}
      >
        <span
          style={{
            fontFamily: "'Courier New', monospace",
            fontWeight: 600,
            color: "#1a1206",
            fontSize: "clamp(6px, 1.1vw, 11px)",
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          {miscellaneous}
        </span>
      </div>

      {/* BARCODE — wide strip along the bottom-center */}
      <div
        className="absolute flex items-center justify-center"
        style={{ left: "25%", top: "78%", width: "50%", height: "16%" }}
      >
        {serial && (
          <Code128
            value={serial}
            height={34}
            barWidth={1.1}
            displayValue={false}
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          />
        )}
      </div>
    </div>
  );
}