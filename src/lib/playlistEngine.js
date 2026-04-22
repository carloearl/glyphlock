/**
 * Playlist Engine — minimum viable scoring + generation for the GlyphLock Music Suite
 *
 * Exports:
 *  - calculatePersonaMatch(persona, entertainer): 0-1 match score
 *  - scoreTrack(track, persona, crowd): 0-100 score with breakdown
 *  - generatePlaylist({ tracks, persona, crowd, limit }): ordered track array
 *  - computeCrowdEnergyScore({ tips, votes, playthrough, manual }): 0-10 composite
 */

const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));

export function computeCrowdEnergyScore({ tips = 0, votes = 0, playthrough = 0, manual = null } = {}) {
  // If manual slider provided, it dominates (80/20 blend with signals)
  const tipsScore = clamp(tips / 200, 0, 1) * 10;        // $200 in 30min = max
  const votesScore = clamp(votes / 20, 0, 1) * 10;       // 20 votes = max
  const playScore = clamp(playthrough, 0, 1) * 10;       // 0-1 ratio
  const signal = (tipsScore * 0.4) + (votesScore * 0.3) + (playScore * 0.3);
  if (manual !== null && manual !== undefined) {
    return Number((manual * 0.8 + signal * 0.2).toFixed(2));
  }
  return Number(signal.toFixed(2));
}

export function calculatePersonaMatch(persona, entertainer) {
  if (!persona || !entertainer) return 0;
  let score = 0;
  let factors = 0;

  const personaGenres = new Set(persona.genre_bias_logic?.primary_genres || []);
  const enterGenres = new Set(entertainer.preferred_genres || []);
  if (personaGenres.size && enterGenres.size) {
    const overlap = [...personaGenres].filter(g => enterGenres.has(g)).length;
    score += overlap / Math.max(personaGenres.size, enterGenres.size);
    factors++;
  }

  const personaMoods = new Set(persona.transition_style_rules?.mood_compatibility || []);
  const enterMoods = new Set(entertainer.preferred_moods || []);
  if (personaMoods.size && enterMoods.size) {
    const overlap = [...personaMoods].filter(m => enterMoods.has(m)).length;
    score += overlap / Math.max(personaMoods.size, enterMoods.size);
    factors++;
  }

  return factors ? clamp(score / factors) : 0.5;
}

export function scoreTrack(track, persona, crowd = {}) {
  if (!track) return { total: 0, breakdown: {} };

  const weights = persona?.weighting_model || { crowd_weight: 0.4, entertainer_weight: 0.4, revenue_weight: 0.2 };
  const energy = crowd.energy_score ?? 5;

  // Genre score
  const primary = new Set(persona?.genre_bias_logic?.primary_genres || []);
  const secondary = new Set(persona?.genre_bias_logic?.secondary_genres || []);
  const excluded = new Set(persona?.genre_bias_logic?.excluded_genres || []);
  let genreScore = 0.5;
  if (track.genre) {
    if (excluded.has(track.genre)) genreScore = 0;
    else if (primary.has(track.genre)) genreScore = 1;
    else if (secondary.has(track.genre)) genreScore = 0.7;
  }

  // Mood vs energy alignment
  const highEnergyMoods = new Set(['high-energy', 'aggressive']);
  const lowEnergyMoods = new Set(['chill', 'sensual']);
  let moodScore = 0.5;
  if (track.mood) {
    if (energy >= 7 && highEnergyMoods.has(track.mood)) moodScore = 1;
    else if (energy <= 4 && lowEnergyMoods.has(track.mood)) moodScore = 1;
    else if (energy > 4 && energy < 7 && track.mood === 'neutral') moodScore = 0.85;
    else moodScore = 0.4;
  }

  // BPM alignment (energy 0-10 → target BPM 80-140)
  let bpmScore = 0.5;
  if (track.bpm) {
    const targetBpm = 80 + (energy * 6);
    const delta = Math.abs(track.bpm - targetBpm);
    bpmScore = clamp(1 - delta / 60);
  }

  const crowdComponent = (moodScore * 0.5 + bpmScore * 0.5) * (weights.crowd_weight || 0);
  const entertainerComponent = genreScore * (weights.entertainer_weight || 0);
  const revenueComponent = 0.6 * (weights.revenue_weight || 0); // neutral placeholder

  const total = Math.round((crowdComponent + entertainerComponent + revenueComponent) * 100);

  return {
    total,
    breakdown: {
      genre: Math.round(genreScore * 100),
      mood: Math.round(moodScore * 100),
      bpm: Math.round(bpmScore * 100),
    },
    reason: `Genre ${Math.round(genreScore * 100)}% · Mood ${Math.round(moodScore * 100)}% · BPM ${Math.round(bpmScore * 100)}%`,
  };
}

export function generatePlaylist({ tracks = [], persona = null, crowd = {}, limit = 20 } = {}) {
  const active = tracks.filter(t => t.active !== false);
  const scored = active.map(t => {
    const s = scoreTrack(t, persona, crowd);
    return { track_id: t.id, title: t.title, artist: t.artist, score: s.total, reason: s.reason };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((t, i) => ({ ...t, position: i + 1 }));
}