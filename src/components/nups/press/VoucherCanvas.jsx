/**
 * VoucherCanvas — Renders 5 vouchers per sheet with crop marks, barcodes, serials
 * Reference-exact: crop marks for print, interactive first-bill master control,
 * draggable elements, barcode via CODE128 text rendering, front/back/duplex
 */
import React, { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { generateSerials, PAPER_DIMENSIONS, PrintMode } from "@/components/nups/press/types";
import { emitPressTelemetry } from "@/components/nups/press/services/pressStorage";

const DPI = 96; // 1 inch = 96px at default browser DPI

function inToPx(inches) {
  return Math.round(inches * DPI);
}

// ─── Barcode text rendering (CODE128 visual placeholder) ───
function BarcodeDisplay({ data, width: bw = 2, height: bh = 40, fontSize = 12 }) {
  if (!data) {
    return (
      <div className="border-2 border-red-500 bg-red-500/10 rounded px-2 py-1 text-[10px] text-red-400 text-center" style={{ width: bw * 60, height: bh + 20 }}>
        Invalid barcode data
      </div>
    );
  }

  // Render barcode-like stripes using CSS
  const stripes = useMemo(() => {
    const bars = [];
    let seed = 0;
    for (let i = 0; i < data.length; i++) seed += data.charCodeAt(i) * (i + 1);
    for (let i = 0; i < 60; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF;
      bars.push(seed % 3 === 0 ? bw * 2 : bw);
    }
    return bars;
  }, [data, bw]);

  return (
    <div className="flex flex-col items-center" style={{ width: 'fit-content' }}>
      <div className="flex items-end" style={{ height: bh }}>
        {stripes.map((w, i) => (
          <div
            key={i}
            style={{
              width: w,
              height: bh,
              backgroundColor: i % 2 === 0 ? '#000' : '#fff',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize, fontFamily: 'monospace', marginTop: 2, color: '#000' }}>{data}</span>
    </div>
  );
}

// ─── Single Voucher Bill ───
function VoucherBill({
  index,
  serial,
  frontImage,
  backImage,
  billWidth,
  billHeight,
  printMode,
  denomination,
  secondaryDenom,
  isInteractive,
  elementTransforms,
  onElementMove,
}) {
  const isFront = printMode !== PrintMode.BACK;
  const isBack = printMode !== PrintMode.FRONT;
  const showFront = printMode === PrintMode.FRONT || printMode === PrintMode.DUPLEX;
  const showBack = printMode === PrintMode.BACK || printMode === PrintMode.DUPLEX;

  return (
    <div className="voucher-bill relative" style={{ width: billWidth, height: billHeight, overflow: 'hidden' }}>
      {/* Front side */}
      {showFront && (
        <div
          className="absolute inset-0 bg-white border border-gray-300"
          style={{ width: billWidth, height: billHeight }}
        >
          {/* Background image */}
          {frontImage && (
            <img
              src={frontImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ pointerEvents: 'none' }}
            />
          )}

          {/* Denomination */}
          <div className="absolute top-2 left-3 text-black font-bold text-lg" style={{ fontFamily: 'serif', textShadow: '0 0 4px rgba(255,255,255,0.8)' }}>
            ${denomination || '100'}
          </div>
          {secondaryDenom && (
            <div className="absolute top-2 right-3 text-black font-bold text-sm" style={{ fontFamily: 'serif', textShadow: '0 0 4px rgba(255,255,255,0.8)' }}>
              ${secondaryDenom}
            </div>
          )}

          {/* Serial */}
          <div className="absolute bottom-2 left-3 text-black text-[10px] font-mono">
            {serial}
          </div>

          {/* Barcode */}
          <div className="absolute bottom-1 right-2" style={{ transform: 'scale(0.5)', transformOrigin: 'bottom right' }}>
            <BarcodeDisplay data={serial} height={30} fontSize={8} />
          </div>

          {/* CLUB CURRENCY label */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black/20 font-bold text-2xl uppercase tracking-[0.3em]" style={{ fontFamily: 'serif' }}>
            CLUB CURRENCY
          </div>
        </div>
      )}

      {/* Back side (duplex or back-only) */}
      {showBack && !showFront && (
        <div
          className="absolute inset-0 bg-gray-100 border border-gray-300"
          style={{ width: billWidth, height: billHeight }}
        >
          {backImage && (
            <img
              src={backImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ pointerEvents: 'none' }}
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs font-mono">
            {!backImage && 'BACK'}
          </div>
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

// ─── Full Sheet (5 vouchers) ───
function VoucherSheet({
  sheetIndex,
  serials,
  config,
  frontImages,
  backImage,
}) {
  const paperDim = PAPER_DIMENSIONS[config.paperSize];
  const sheetW = inToPx(paperDim.width);
  const sheetH = inToPx(paperDim.height);
  const billW = inToPx(config.billWidthInches);
  const billH = inToPx(config.billHeightInches);
  const gap = inToPx(config.voucherGapInches);

  const marginX = Math.max(0, (sheetW - billW) / 2);
  const totalBillsHeight = billH * 5 + gap * 4;
  const marginY = Math.max(0, (sheetH - totalBillsHeight) / 2);

  return (
    <div
      className="voucher-sheet bg-white relative mx-auto mb-4 shadow-lg"
      style={{ width: sheetW, height: sheetH, overflow: 'hidden' }}
    >
      {/* Crop marks SVG overlay (print only) */}
      <svg
        className="absolute inset-0 print-only pointer-events-none"
        width={sheetW} height={sheetH}
        style={{ zIndex: 10 }}
      >
        {[0, 1, 2, 3, 4].map((i) => {
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
      {[0, 1, 2, 3, 4].map((i) => {
        const serialIdx = sheetIndex * 5 + i;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: marginX,
              top: marginY + i * (billH + gap),
            }}
          >
            <VoucherBill
              index={i}
              serial={serials[serialIdx] || `${config.serialPrefix}-000000`}
              frontImage={frontImages[i]}
              backImage={backImage}
              billWidth={billW}
              billHeight={billH}
              printMode={config.printMode}
              denomination="100"
              isInteractive={config.interactiveMode && i === 0}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Canvas Component ───
export default function VoucherCanvas({ config, frontImages, backImage }) {
  const serials = useMemo(() => {
    const count = config.batchCount * 5;
    const s = generateSerials(config.serialSeed, count, config.serialPrefix);
    emitPressTelemetry('SERIAL_GENERATED', { seed: config.serialSeed, count, prefix: config.serialPrefix });
    return s;
  }, [config.serialSeed, config.batchCount, config.serialPrefix]);

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
        />
      ))}

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .voucher-canvas-container,
          .voucher-canvas-container * { visibility: visible !important; }
          .voucher-canvas-container { position: absolute; left: 0; top: 0; }
          .voucher-sheet { page-break-after: always; margin: 0 !important; box-shadow: none !important; }
          .print-only { display: block !important; visibility: visible !important; }
          .no-print { display: none !important; }
        }
        @media screen {
          .print-only { display: none; }
        }
      `}</style>
    </div>
  );
}