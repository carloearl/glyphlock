/**
 * VoucherCanvas — Renders voucher sheets in 5-up or 4-up (US dollar size) layouts
 * ALL bill elements (denomination, serial, barcode, QR, watermark, text, image)
 * are draggable/toggleable via DraggableBillElement — no hardcoded positions.
 */
import React, { useMemo } from "react";
import { generateSerials, PAPER_DIMENSIONS, PrintMode, LayoutMode, US_DOLLAR_DIMS } from "@/components/nups/press/types";
import DraggableBillElement from "@/components/nups/press/DraggableBillElement";

const DPI = 96;
function inToPx(inches) { return Math.round(inches * DPI); }

// ─── Single Voucher Bill ───
function VoucherBill({
  serial, frontImage, backImage, billWidth, billHeight, printMode,
  denomination, isInteractive, elements = [], onElementUpdate, onElementRemove,
}) {
  const showFront = printMode === PrintMode.FRONT || printMode === PrintMode.DUPLEX;
  const showBack = printMode === PrintMode.BACK;

  // Resolve element content dynamically based on element type
  const resolved = (el) => {
    if (el.type === "denomination") return { ...el, content: denomination || "100" };
    if (el.type === "serial" || el.type === "barcode" || el.type === "qr") {
      return { ...el, content: el.content || serial };
    }
    return el;
  };

  return (
    <div className="voucher-bill relative" style={{ width: billWidth, height: billHeight, overflow: "hidden" }}>
      {showFront && (
        <div
          className="absolute inset-0 border border-gray-300"
          style={{
            width: billWidth,
            height: billHeight,
            backgroundColor: "#fff",
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
          }}
        >
          {frontImage && (
            <img
              src={frontImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              draggable={false}
              style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
            />
          )}

          {/* ALL elements are draggable overlays — including defaults */}
          {elements.map((el) => (
            <DraggableBillElement
              key={el.id}
              element={resolved(el)}
              billWidth={billWidth}
              billHeight={billHeight}
              onUpdate={onElementUpdate || (() => {})}
              onRemove={onElementRemove || (() => {})}
              isInteractive={isInteractive}
            />
          ))}
        </div>
      )}

      {showBack && (
        <div
          className="absolute inset-0 border border-gray-300"
          style={{
            width: billWidth,
            height: billHeight,
            backgroundColor: "#f3f4f6",
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
          }}
        >
          {backImage && (
            <img
              src={backImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              draggable={false}
              style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
            />
          )}
          {!backImage && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs font-mono">BACK</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Crop Marks ───
function CropMarks({ x, y, size = 12 }) {
  return (
    <g stroke="#000" strokeWidth="0.5">
      <line x1={x - size} y1={y} x2={x - 2} y2={y} />
      <line x1={x + 2} y1={y} x2={x + size} y2={y} />
      <line x1={x} y1={y - size} x2={x} y2={y - 2} />
      <line x1={x} y1={y + 2} x2={x} y2={y + size} />
    </g>
  );
}

// ─── Full Sheet ───
function VoucherSheet({ sheetIndex, serials, config, frontImages, backImage, elements, onElementUpdate, onElementRemove }) {
  const is4Up = config.layoutMode === LayoutMode.FOUR_PER_SHEET;
  const billsPerSheet = is4Up ? 4 : 5;

  const paperDim = PAPER_DIMENSIONS[config.paperSize];
  const sheetW = inToPx(paperDim.width);
  const sheetH = inToPx(paperDim.height);

  const billW = is4Up ? inToPx(US_DOLLAR_DIMS.width) : inToPx(config.billWidthInches);
  const billH = is4Up ? inToPx(US_DOLLAR_DIMS.height) : inToPx(config.billHeightInches);
  const gap = inToPx(config.voucherGapInches);

  const marginX = Math.max(0, (sheetW - billW) / 2);
  const totalBillsHeight = billH * billsPerSheet + gap * (billsPerSheet - 1);
  const marginY = Math.max(0, (sheetH - totalBillsHeight) / 2);

  return (
    <div
      className="voucher-sheet relative mx-auto mb-4 shadow-lg"
      style={{
        width: sheetW,
        height: sheetH,
        overflow: "hidden",
        backgroundColor: "#fff",
        printColorAdjust: "exact",
        WebkitPrintColorAdjust: "exact",
      }}
    >
      {/* Crop marks */}
      {config.showCropMarks !== false && (
        <svg
          className="absolute inset-0 pointer-events-none"
          width={sheetW}
          height={sheetH}
          style={{ zIndex: 10 }}
        >
          {Array.from({ length: billsPerSheet }).map((_, i) => {
            const bx = marginX;
            const by = marginY + i * (billH + gap);
            return (
              <g key={i}>
                <CropMarks x={bx} y={by} />
                <CropMarks x={bx + billW} y={by} />
                <CropMarks x={bx} y={by + billH} />
                <CropMarks x={bx + billW} y={by + billH} />
              </g>
            );
          })}
        </svg>
      )}

      {/* Bills */}
      {Array.from({ length: billsPerSheet }).map((_, i) => {
        const serialIdx = sheetIndex * billsPerSheet + i;
        return (
          <div key={i} className="absolute" style={{ left: marginX, top: marginY + i * (billH + gap) }}>
            <VoucherBill
              serial={serials[serialIdx] || `${config.serialPrefix}-000000`}
              frontImage={frontImages[i] || frontImages[0]}
              backImage={backImage}
              billWidth={billW}
              billHeight={billH}
              printMode={config.printMode}
              denomination={config.denomination || "100"}
              isInteractive={config.interactiveMode && i === 0 && sheetIndex === 0}
              elements={elements}
              onElementUpdate={onElementUpdate}
              onElementRemove={onElementRemove}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Canvas ───
export default function VoucherCanvas({ config, frontImages, backImage, elements, onElementUpdate, onElementRemove }) {
  const is4Up = config.layoutMode === LayoutMode.FOUR_PER_SHEET;
  const billsPerSheet = is4Up ? 4 : 5;

  const serials = useMemo(() => {
    const count = config.batchCount * billsPerSheet;
    return generateSerials(config.serialSeed, count, config.serialPrefix);
  }, [config.serialSeed, config.batchCount, config.serialPrefix, billsPerSheet]);

  return (
    <div className="voucher-canvas-container overflow-auto p-4">
      {Array.from({ length: config.batchCount }, (_, sheetIdx) => (
        <VoucherSheet
          key={sheetIdx}
          sheetIndex={sheetIdx}
          serials={serials}
          config={config}
          frontImages={frontImages}
          backImage={backImage}
          elements={elements}
          onElementUpdate={onElementUpdate}
          onElementRemove={onElementRemove}
        />
      ))}

      <style>{`
        @media print {
          @page { margin: 0; size: auto; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          body * { visibility: hidden !important; }
          .voucher-canvas-container,
          .voucher-canvas-container * { visibility: visible !important; }
          .voucher-canvas-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
            overflow: visible !important;
          }
          .voucher-sheet {
            page-break-after: always;
            break-after: page;
            margin: 0 auto !important;
            box-shadow: none !important;
            break-inside: avoid;
            background: #fff !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .voucher-sheet:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          .print-hide,
          .group\\/el > button,
          .group\\/el > div[class*="cursor-se-resize"] {
            display: none !important;
            visibility: hidden !important;
          }
          img, svg, [style*="background"] {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}