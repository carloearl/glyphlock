/**
 * Press AI Adapter — Live via Base44 InvokeLLM
 * Provides: voucher analysis, denomination suggestions, layout optimization
 */
import { base44 } from "@/api/base44Client";

export const AI_AVAILABLE = true;

/**
 * Analyze a voucher configuration for quality, compliance, readability
 */
export async function analyzeVoucher(config) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a currency/voucher print design expert for a nightclub VIP system called "Club Currency."

Analyze this voucher press configuration and provide actionable feedback:
- Paper: ${config.paperSize}
- Bill size: ${config.billWidthInches}" × ${config.billHeightInches}"
- Gap between bills: ${config.voucherGapInches}"
- Print mode: ${config.printMode}
- Batch count: ${config.batchCount} sheets
- Serial prefix: ${config.serialPrefix}

Evaluate:
1. Print quality risks (bleed, cut lines, alignment)
2. Bill dimensions vs industry standard
3. Security features recommendations
4. Readability at this size
5. Cost efficiency of this layout

Be concise and practical. Output max 6 bullet points.`,
    response_json_schema: {
      type: "object",
      properties: {
        overall_grade: { type: "string", description: "A-F grade" },
        issues: {
          type: "array",
          items: {
            type: "object",
            properties: {
              severity: { type: "string", enum: ["critical", "warning", "info"] },
              message: { type: "string" }
            }
          }
        },
        recommendations: {
          type: "array",
          items: { type: "string" }
        }
      }
    }
  });
  return { success: true, data: res };
}

/**
 * Suggest optimal denominations based on venue context
 */
export async function suggestDenominations(context) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a nightclub financial operations advisor. A VIP club needs denomination suggestions for their internal currency system.

Context:
- Current denominations available: $100, $500, $1,000, $2,000
- Convenience fee rate: 30%
- Dancer payout rate: 50%
- Average VIP spend: ${context?.avgSpend || "unknown"}
- Peak night: ${context?.peakNight || "Saturday"}
- Typical party size: ${context?.partySize || "2-6 guests"}

Suggest the optimal denomination mix for printing tonight's currency run. Consider:
1. Most commonly requested amounts
2. Minimizing change/breakage issues
3. Maximizing print efficiency (fewer sheets)
4. Psychological pricing (round numbers feel premium)

Output a recommended print run.`,
    response_json_schema: {
      type: "object",
      properties: {
        recommended_mix: {
          type: "array",
          items: {
            type: "object",
            properties: {
              denomination: { type: "number" },
              quantity: { type: "number" },
              reason: { type: "string" }
            }
          }
        },
        total_face_value: { type: "number" },
        total_sheets_needed: { type: "number" },
        tip: { type: "string" }
      }
    }
  });
  return { success: true, data: res };
}

/**
 * Optimize voucher layout for minimal waste
 */
export async function optimizeLayout(config) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a print layout optimization engine. Optimize this voucher sheet layout:

Paper: ${config.paperSize} (${config.paperSize === 'letter' ? '8.5×11"' : '8.5×14"'})
Current bill size: ${config.billWidthInches}" × ${config.billHeightInches}"
Current gap: ${config.voucherGapInches}"
Print mode: ${config.printMode}

Calculate:
1. Maximum bills per sheet with current dimensions
2. Optimal bill dimensions to maximize bills per sheet while keeping readability
3. Recommended margins (top/bottom/sides)
4. Paper waste percentage (current vs optimized)

Give specific numbers.`,
    response_json_schema: {
      type: "object",
      properties: {
        current_bills_per_sheet: { type: "number" },
        optimized_bills_per_sheet: { type: "number" },
        optimized_width: { type: "number", description: "inches" },
        optimized_height: { type: "number", description: "inches" },
        optimized_gap: { type: "number", description: "inches" },
        waste_reduction_percent: { type: "number" },
        notes: { type: "string" }
      }
    }
  });
  return { success: true, data: res };
}