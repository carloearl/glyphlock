/**
 * AI Mixer Assistant
 * OpenAI adapter via Base44 InvokeLLM pipeline
 * Handles classify, suggest, optimize with retry logic
 */
import { base44 } from "@/api/base44Client";
import { emitTelemetry } from "../events/mixerTelemetry";

const MAX_RETRIES = 3;
const BACKOFF = [1000, 2000, 4000];

async function invokeWithRetry(prompt, schema, retries = 0) {
  try {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema,
    });
    return res;
  } catch (e) {
    if (retries < MAX_RETRIES - 1) {
      await new Promise((r) => setTimeout(r, BACKOFF[retries]));
      return invokeWithRetry(prompt, schema, retries + 1);
    }
    throw e;
  }
}

export async function classifySong({ title, artist, notes }) {
  const prompt = `You are a DJ music classifier for an adult entertainment venue. Given this song, classify its vibe and energy level.

Song: "${title}" by ${artist}
${notes ? `Notes: ${notes}` : ""}

Vibe options: slow, seductive, highEnergy, experimental, crowdControl, cooldown
Energy level: integer 1-10 (1=lowest, 10=highest)

Return your classification.`;

  const schema = {
    type: "object",
    properties: {
      vibeTag: { type: "string", enum: ["slow", "seductive", "highEnergy", "experimental", "crowdControl", "cooldown"] },
      energyLevel: { type: "integer" },
      reasoning: { type: "string" },
    },
    required: ["vibeTag", "energyLevel"],
  };

  try {
    const data = await invokeWithRetry(prompt, schema);
    if (!data?.vibeTag || !data?.energyLevel) {
      return { success: false, error: "Malformed AI response" };
    }
    return { success: true, data };
  } catch (e) {
    emitTelemetry("AI_ERROR", { requestType: "classify", message: e.message });
    return { success: false, error: e.message || "AI classification failed" };
  }
}

export async function suggestPlaylist(songs, profileName) {
  const songList = songs.map((s, i) => `${i + 1}. "${s.title}" by ${s.artist} [${s.vibeTag}, energy:${s.energyLevel}]`).join("\n");

  const prompt = `You are an expert DJ consultant for adult entertainment venues. Analyze this playlist for dancer "${profileName}" and provide actionable suggestions.

Current playlist (in order):
${songList || "(empty)"}

Provide 3-7 specific suggestions. Types: reorder, add_cooldown, remove_dead_energy, increase_peak, improve_flow, add_variety.`;

  const schema = {
    type: "object",
    properties: {
      suggestions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: { type: "string" },
            description: { type: "string" },
            targetSongIndex: { type: "integer" },
          },
          required: ["type", "description"],
        },
      },
      overallAssessment: { type: "string" },
    },
    required: ["suggestions"],
  };

  try {
    const data = await invokeWithRetry(prompt, schema);
    if (!data?.suggestions || !Array.isArray(data.suggestions)) {
      return { success: false, error: "Malformed AI response" };
    }
    return { success: true, data };
  } catch (e) {
    emitTelemetry("AI_ERROR", { requestType: "suggest", message: e.message });
    return { success: false, error: e.message || "AI suggestion failed" };
  }
}

export async function optimizeProfile(profile, songs) {
  const songDetails = songs.map((s) => `"${s.title}" [${s.vibeTag}, energy:${s.energyLevel}, fav:${s.favoriteFlag}]`).join(", ");

  const prompt = `You are a DJ profile optimizer. Analyze this dancer profile and suggest improvements.

Dancer: ${profile.name}
Tags: ${profile.tags?.join(", ") || "none"}
Songs (${songs.length}): ${songDetails || "none"}

Suggest: tag cleanup, duplicate detection, missing vibe categories, under-used tracks, energy distribution improvements.`;

  const schema = {
    type: "object",
    properties: {
      improvements: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: { type: "string" },
            description: { type: "string" },
            priority: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["type", "description", "priority"],
        },
      },
      vibeDistribution: { type: "object" },
      energyScore: { type: "number" },
    },
    required: ["improvements"],
  };

  try {
    const data = await invokeWithRetry(prompt, schema);
    if (!data?.improvements || !Array.isArray(data.improvements)) {
      return { success: false, error: "Malformed AI response" };
    }
    return { success: true, data };
  } catch (e) {
    emitTelemetry("AI_ERROR", { requestType: "optimize", message: e.message });
    return { success: false, error: e.message || "AI optimization failed" };
  }
}