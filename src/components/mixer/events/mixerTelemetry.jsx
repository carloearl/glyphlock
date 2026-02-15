/**
 * Mixer Telemetry
 * Emits events to GlyphBot telemetry pipeline
 * Safe no-op if pipeline unavailable
 */
import { base44 } from "@/api/base44Client";

export function emitTelemetry(eventName, properties = {}) {
  try {
    base44.analytics.track({
      eventName: `mixer_${eventName.toLowerCase()}`,
      properties: {
        ...properties,
        timestamp: Date.now(),
      },
    });
  } catch (e) {
    // Safe no-op — never break UI for telemetry
    console.debug(`[MixerTelemetry] ${eventName}`, properties);
  }
}