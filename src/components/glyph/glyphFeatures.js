// What each of Glyph's 13 phases unlocks. Unlocks are cumulative: reaching a phase keeps every earlier one.
// Static data written by GlyphLock; no user input. Each feature is a real control in the card, nothing more.
export const PHASE_FEATURES = [
  { phase: 0, id: "nodes", name: "NODES", what: "Five quick asks around the emblem: consult, what we do, secure QR, surprise, this page." },
  { phase: 1, id: "next", name: "FOLLOW-UPS", what: "Three suggested next questions under each answer. Tap one to ask it." },
  { phase: 2, id: "copy", name: "COPY", what: "Copy any answer with one tap." },
  { phase: 3, id: "voice", name: "VOICE", what: "Glyph reads an answer out loud." },
  { phase: 4, id: "jump", name: "PAGE JUMP", what: "Every GlyphLock page an answer mentions shows as a jump button." },
  { phase: 5, id: "depth", name: "DEPTH DIAL", what: "Switch answers between Brief and Deep." },
  { phase: 6, id: "pins", name: "PINS", what: "Pin answers you want to keep and open them any time on this device." },
  { phase: 7, id: "handoff", name: "HANDOFF", what: "Copy your questions and go straight to Consultation to send them to the team." },
  { phase: 8, id: "export", name: "EXPORT", what: "Download this chat as a text file." },
  { phase: 9, id: "memory", name: "MEMORY", what: "This chat survives a page reload for the rest of your visit." },
  { phase: 10, id: "lens", name: "LENS", what: "Pick who the answer is for: Plain, Builder or Business." },
  { phase: 11, id: "commands", name: "COMMANDS", what: "Type / for shortcuts like /consult, /export, /pins and /recap." },
  { phase: 12, id: "recap", name: "RECAP", what: "Glyph sums up the whole chat with your next steps." },
];

export const has = (phase, id) => {
  const f = PHASE_FEATURES.find((x) => x.id === id);
  return !!f && phase >= f.phase;
};

export const featureAt = (phase) => PHASE_FEATURES.find((f) => f.phase === phase) || null;
export const nextFeature = (phase) => PHASE_FEATURES.find((f) => f.phase > phase) || null;

// Glyph is asked to end every answer with one line: NEXT: question | question | question
const NEXT_RE = /\n?\s*\**NEXT:?\**:?\s*([^\n]*)\s*$/i;

export function splitNext(text = "") {
  const t = String(text);
  // While streaming, hide a NEXT line that has started but not finished.
  const at = t.search(/\n\s*\**NEXT\b/i);
  if (at === -1) return { body: t, next: [] };
  const m = t.slice(at).match(NEXT_RE);
  const next = m
    ? m[1].split("|").map((q) => q.replace(/^[\s\-*•\d.]+/, "").replace(/[*_`]/g, "").trim()).filter((q) => q.length > 3 && q.length < 120).slice(0, 3)
    : [];
  return { body: t.slice(0, at).trimEnd(), next };
}

// Plain text for copy, voice and export.
export function plainText(md = "") {
  return String(md)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/[*_`#>]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Internal links in an answer that match a verified page, deduped, in order.
export function pageLinks(md = "", pages = []) {
  const out = [];
  const seen = new Set();
  const re = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;
  let m;
  while ((m = re.exec(String(md)))) {
    const path = m[2].split(/[?#]/)[0];
    const page = pages.find((p) => p.path.toLowerCase() === path.toLowerCase());
    if (page && !seen.has(page.path)) { seen.add(page.path); out.push(page); }
  }
  return out.slice(0, 4);
}

export const DEPTHS = {
  brief: "Keep the answer to two or three short sentences.",
  deep: "Give a fuller answer: a short opening line, then up to five short points, still only from what you are given.",
};

export const LENSES = {
  plain: "Write for someone who isn't technical. No jargon.",
  builder: "Write for a developer or builder. Name the tool or page and the steps.",
  business: "Write for a business owner. Lead with what it does for their business; never quote prices or results.",
};

export const COMMANDS = [
  { cmd: "/consult", need: "nodes", what: "book a consultation" },
  { cmd: "/qr", need: "nodes", what: "make a secure QR code" },
  { cmd: "/map", need: "nodes", what: "see every phase and unlock" },
  { cmd: "/pins", need: "pins", what: "open your pinned answers" },
  { cmd: "/handoff", need: "handoff", what: "send your questions to the team" },
  { cmd: "/export", need: "export", what: "download this chat" },
  { cmd: "/recap", need: "recap", what: "sum up this chat" },
  { cmd: "/clear", need: "nodes", what: "start a new chat" },
];

export const RECAP_ASK = "Recap our chat: what I asked, what you told me, and my next steps on GlyphLock.";
