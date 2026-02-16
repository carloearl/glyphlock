/**
 * Club Currency Press — Type Definitions & Constants
 * Ported from reference implementation. No changes to data shapes.
 */

// Contract status stages
export const ContractStatus = {
  DRAFT: 'DRAFT',
  SIGN: 'SIGN',
  ISSUED: 'ISSUED',
  ARCHIVED: 'ARCHIVED',
};

// Print modes
export const PrintMode = {
  FRONT: 'front',
  BACK: 'back',
  DUPLEX: 'duplex',
};

// Paper sizes
export const PaperSize = {
  LETTER: 'letter',
  LEGAL: 'legal',
};

export const PAPER_DIMENSIONS = {
  letter: { width: 8.5, height: 11, label: 'Letter (8.5 × 11)' },
  legal: { width: 8.5, height: 14, label: 'Legal (8.5 × 14)' },
};

// Layout modes
export const LayoutMode = {
  FIVE_PER_SHEET: '5up',
  FOUR_PER_SHEET: '4up',
};

// US Dollar bill dimensions (6.14 × 2.61 inches)
export const US_DOLLAR_DIMS = {
  width: 6.14,
  height: 2.61,
};

// Currency denominations
export const CURRENCY_AMOUNTS = [100, 500, 1000, 2000];

// Financial rules (reference-exact)
export const CONVENIENCE_FEE_RATE = 0.30;
export const DANCER_PAYOUT_RATE = 0.50;

// Default voucher config
export const DEFAULT_PRESS_CONFIG = {
  paperSize: PaperSize.LETTER,
  printMode: PrintMode.FRONT,
  billWidthInches: 6,
  billHeightInches: 2.5,
  voucherGapInches: 0.25,
  batchCount: 1,
  serialPrefix: 'CC',
  serialSeed: 1,
  interactiveMode: true,
};

// Default element transform
export const DEFAULT_ELEMENT_TRANSFORM = {
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  width: 100,
  height: 40,
};

/**
 * Create a new ContractRecord
 */
export function createContractRecord(overrides = {}) {
  return {
    id: crypto.randomUUID().slice(0, 8).toUpperCase(),
    timestamp: Date.now(),
    customerName: '',
    cardLast4: '',
    currencyAmount: 0,
    convenienceFee: 0,
    totalAmount: 0,
    dancerPayout: 0,
    housePortion: 0,
    txId: `TX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    posTerminalId: `POS-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    status: ContractStatus.DRAFT,
    signatureData: null,
    thumbprintData: null,
    ...overrides,
  };
}

/**
 * Calculate financials from currency amount
 */
export function calculateFinancials(currencyAmount) {
  const convenienceFee = currencyAmount * CONVENIENCE_FEE_RATE;
  const totalAmount = currencyAmount + convenienceFee;
  const dancerPayout = currencyAmount * DANCER_PAYOUT_RATE;
  const housePortion = currencyAmount * DANCER_PAYOUT_RATE + convenienceFee;
  return { convenienceFee, totalAmount, dancerPayout, housePortion };
}

/**
 * Generate deterministic serial numbers
 */
export function generateSerials(seed, count, prefix = 'CC') {
  const serials = [];
  let s = seed;
  for (let i = 0; i < count; i++) {
    // Simple LCG for deterministic randomization
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
    const num = Math.abs(s % 1000000).toString().padStart(6, '0');
    serials.push(`${prefix}-${num}`);
  }
  return serials;
}