/**
 * Press Storage Service — localStorage persistence + telemetry
 * Keys match directive exactly.
 */
import { DEFAULT_PRESS_CONFIG } from "@/components/nups/press/types";

const KEYS = {
  config: 'nups_press_config_v1',
  frontImages: 'nups_press_frontImages_v1',
  backImage: 'nups_press_backImage_v1',
  contractRecords: 'nups_press_contractRecords_v1',
};

// ─── Telemetry ───
export function emitPressTelemetry(event, data) {
  try {
    if (typeof window !== 'undefined' && window.console) {
      console.log(`[PRESS_TELEMETRY] ${event}`, data);
    }
    // Forward to NUPS pipeline if available
    try {
      const { base44 } = require("@/api/base44Client");
      base44.analytics.track({ eventName: `press_${event.toLowerCase()}`, properties: data });
    } catch { /* silent */ }
  } catch { /* never crash */ }
}

// ─── Safe JSON parse ───
function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    emitPressTelemetry('STORAGE_ERROR', { operation: 'set', key, message: err.message });
    throw err;
  }
}

// ─── Config ───
export function loadPressConfig() {
  return safeGet(KEYS.config, { ...DEFAULT_PRESS_CONFIG });
}

export function savePressConfig(config) {
  safeSet(KEYS.config, config);
}

// ─── Front Images (base64 array, 5 slots) ───
export function loadFrontImages() {
  return safeGet(KEYS.frontImages, [null, null, null, null, null]);
}

export function saveFrontImages(images) {
  safeSet(KEYS.frontImages, images);
}

// ─── Back Image (single base64) ───
export function loadBackImage() {
  return safeGet(KEYS.backImage, null);
}

export function saveBackImage(image) {
  safeSet(KEYS.backImage, image);
}

// ─── Contract Records ───
export function loadContractRecords() {
  return safeGet(KEYS.contractRecords, []);
}

export function saveContractRecords(records) {
  safeSet(KEYS.contractRecords, records);
}

export function appendContractRecord(record) {
  const records = loadContractRecords();
  records.push(record);
  saveContractRecords(records);
  return records;
}