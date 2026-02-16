/**
 * VoucherCanvas — Renders voucher sheets in 5-up or 4-up (US dollar size) layouts
 * Supports draggable elements, crop marks, print styles
 */
import React, { useMemo, useState } from "react";
import { generateSerials, PAPER_DIMENSIONS, PrintMode, LayoutMode, US_DOLLAR_DIMS } from "@/components/nups/press/types";
import { emitPressTelemetry } from "@/components/nups/press/services/pressStorage";
import DraggableBillElement from "@/components/nups/press/DraggableBillElement";

const DPI = 96;
function inToPx(inches) { return Math.round(inches * DPI); }

// ─── Barcode text rendering ───
function BarcodeDisplay({ data, width: bw = 2, height: bh = 40, fontSize = 12 }) {
  const stripes = useMemo(() => {
    if (!data) return [];
    const bars = [];
    let seed = 0;
    for (let i = 0; i < data.length; i++) seed += data.charCodeAt(i) * (i + 1);
    for (let i = 0; i < 60; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF;
      bars.push(seed % 3 === 0 ? bw * 2 : bw);
    }
    return bars;
  }, [data, bw]);

  if (!data) return <div className="text-[10px] text-red-400">No barcode</div>;

  return (
    <div className="flex flex-col items-center" style={{ width: 'fit-content' }}>
      <div className="flex items-end" style={{ height: bh }}>
        {stripes.map((w, i) => (
          <div key={i} style={{ width: w, height: bh, backgroundColor: i % 2 === 0 ? '#000' : '#fff' }} />
        ))}
      </div>
      <span style={{ fontSize, fontFamily: 'monospace', marginTop: 2, color: '#000' }}>{data}</span>
    </div>
  );
}

// ─── Single Voucher Bill ───
function VoucherBill({ serial, frontImage, backImage, billWidth, billHeight, printMode, denomination, isInteractive, elements, onElementUpdate, onElementRemove }) {
  const showFront = printMode === PrintMode.FRONT || printMode === PrintMode.DUPLEX;
  const showBack = printMode === PrintMode.BACK;

  return (
    <div className="voucher-bill relative" style={{ width: billWidth, height: billHeight, overflow: 'hidden' }}>
      {showFront && (
        <div className="absolute inset-0 bg-white border border-gray-300" style={{ width: billWidth, height: billHeight }}>
          {frontImage && (
            <img src={frontImage} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" draggable={false} />
          )}
          <div className="absolute top-2 left-3 text-black font-bold text-lg" style={{ fontFamily: 'serif', textShadow: '0 0 4px rgba(255,255,255,0.8)' }}>
            ${denomination || '100'}
          </div>
          <div className="absolute bottom-2 left-3 text-black text-[10px] font-mono">{serial}</div>
          <div className="absolute bottom-1 right-2" style={{ transform: 'scale(0.5)', transformOrigin: 'bottom right' }}>
            <BarcodeDisplay data={serial} height={30} fontSize={8} />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black/20 font-bold text-2xl uppercase tracking-[0.3em]" style={{ fontFamily: 'serif' }}>
            CLUB CURRENCY
          </div>

          {/* Draggable overlay elements */}
          {(elements || []).map((el) => (
            <DraggableBillElement
              key={el.id}
              element={el}
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
        <div className="absolute inset-0 bg-gray-100 border border-gray-300" style={{ width: billWidth, height: billHeight }}>
          {backImage && <img src={backImage} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" draggable={false} />}
          {!backImage && <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs font-mono">BACK</div>}
        </div>
      )}
    </div>
  );
}

// ─── Crop Marks ───
function CropMarks({ x, y, size = 12 }) {
  return (
    <g className="crop-mark print-only" stroke="#000" strokeWidth="0.5">
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

  // For 4-up use US dollar dimensions
  const billW = is4Up ? inToPx(US_DOLLAR_DIMS.width) : inToPx(config.billWidthInches);
  const billH = is4Up ? inToPx(US_DOLLAR_DIMS.height) : inToPx(config.billHeightInches);
  const gap = inToPx(config.voucherGapInches);

  const marginX = Math.max(0, (sheetW - billW) / 2);
  const totalBillsHeight = billH * billsPerSheet + gap * (billsPerSheet - 1);
  const marginY = Math.max(0, (sheetH - totalBillsHeight) / 2);

  return (
    <div className="voucher-sheet bg-white relative mx-auto mb-4 shadow-lg" style={{ width: sheetW, height: sheetH, overflow: 'hidden' }}>
      {/* Crop marks */}
      <svg className="absolute inset-0 print-only pointer-events-none" width={sheetW} height={sheetH} style={{ zIndex: 10 }}>
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
              denomination={config.denomination || '100'}
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
          body * { visibility: hidden !important; }
          .voucher-canvas-container,
          .voucher-canvas-container * { visibility: visible !important; }
          .voucher-canvas-container { position: absolute; left: 0; top: 0; }
          .voucher-sheet { page-break-after: always; margin: 0 !important; box-shadow: none !important; }
          .print-only { display: block !important; visibility: visible !important; }
          .no-print { display: none !important; }
          /* Hide drag handles in print */
          .group\\/el > button, .group\\/el > div:last-child { display: none !important; }
        }
        @media screen {
          .print-only { display: none; }
        }
      `}</style>
    </div>
  );
}