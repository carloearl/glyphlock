// GlyphBot Prime: Singularity Edition card markup (pure HTML + CSS card).
// Source of truth: the GlyphBot Prime card files. Styles: ./glyphbotPrimeCard.css
// Static markup written by GlyphLock, no user input is ever interpolated here.
export const GLYPHBOT_PRIME_CARD_MARKUP = `
<div class="gb">
  <input class="gb-in gb-ph" type="radio" name="gb-phase" id="gb-p0" aria-label="Phase 0 Void" checked>
  <input class="gb-in gb-ph" type="radio" name="gb-phase" id="gb-p1" aria-label="Phase 1 White">
  <input class="gb-in gb-ph" type="radio" name="gb-phase" id="gb-p2" aria-label="Phase 2 Alpha">
  <input class="gb-in gb-ph" type="radio" name="gb-phase" id="gb-p3" aria-label="Phase 3 Beta">
  <input class="gb-in gb-ph" type="radio" name="gb-phase" id="gb-p4" aria-label="Phase 4 Gamma">
  <input class="gb-in gb-ph" type="radio" name="gb-phase" id="gb-p5" aria-label="Phase 5 Delta">
  <input class="gb-in gb-ph" type="radio" name="gb-phase" id="gb-p6" aria-label="Phase 6 Epsilon">
  <input class="gb-in gb-ph" type="radio" name="gb-phase" id="gb-p7" aria-label="Phase 7 Zeta">
  <input class="gb-in gb-ph" type="radio" name="gb-phase" id="gb-p8" aria-label="Phase 8 Eta">
  <input class="gb-in gb-ph" type="radio" name="gb-phase" id="gb-p9" aria-label="Phase 9 Theta">
  <input class="gb-in gb-ph" type="radio" name="gb-phase" id="gb-p10" aria-label="Phase 10 Iota">
  <input class="gb-in gb-ph" type="radio" name="gb-phase" id="gb-p11" aria-label="Phase 11 Kappa">
  <input class="gb-in gb-ph" type="radio" name="gb-phase" id="gb-p12" aria-label="Phase 12 Omega">
  <input class="gb-in gb-ph" type="radio" name="gb-phase" id="gb-fin" aria-label="Return to Void">
  <input class="gb-in" type="checkbox" id="gb-flip" aria-label="Flip card to read the lore">
  <input class="gb-in gb-mr" type="radio" name="gb-modal" id="gb-m0" aria-label="Close panel" checked>
  <input class="gb-in gb-mr" type="radio" name="gb-modal" id="gb-m1" aria-label="Strike">
  <input class="gb-in gb-mr" type="radio" name="gb-modal" id="gb-m2" aria-label="Rift">
  <input class="gb-in gb-mr" type="radio" name="gb-modal" id="gb-m3" aria-label="Aegis">
  <input class="gb-in gb-mr" type="radio" name="gb-modal" id="gb-m4" aria-label="Mirror">

  <div class="gb-stage">
    <div class="gb-tilt">
      <div class="gb-press">

        <div class="gb-face gb-front">
          <div class="gb-bg"></div>
          <div class="gb-frame"></div>
          <div class="gb-head">
            <div class="gb-row"><span class="gb-pill gb-v-num"></span><span class="gb-teth-tag">TETHER <b>&#9670;</b> LOCKED</span></div>
            <div class="gb-title">GLYPHBOT</div>
            <div class="gb-sub">PRIME &middot; SINGULARITY</div>
            <div class="gb-pnw"><div class="gb-pn gb-v-pn"></div><div class="gb-tag gb-v-tag"></div></div>
          </div>

          <div class="gb-bay">
            <div class="gb-col">
              <div class="gb-node gb-n-str"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg><label for="gb-m1" class="gb-hit"><span class="gb-sr">Strike</span></label><span class="gb-nl" aria-hidden="true">STRIKE</span></div>
              <div class="gb-node gb-n-ana"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h7a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H4z"/><path d="M20 6h-3a3 3 0 0 0-3 3"/></svg><label for="gb-flip" class="gb-hit"><span class="gb-sr">Lore</span></label><span class="gb-nl" aria-hidden="true">LORE</span></div>
              <div class="gb-node gb-n-aeg"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></svg><label for="gb-m3" class="gb-hit"><span class="gb-sr">Aegis</span></label><span class="gb-nl" aria-hidden="true">AEGIS</span></div>
            </div>

            <div class="gb-art">
              <div class="gb-wave"></div>
              <div class="gb-ring gb-r1"></div>
              <div class="gb-clock"><i class="gb-hand"></i></div>
              <div class="gb-teth"><i class="gb-lock"></i></div>
              <div class="gb-core"></div>
              <div class="gb-sym gb-v-sym" aria-hidden="true"></div>
              <div class="gb-eye"></div>
              <div class="gb-final" aria-hidden="true">Proud of all 3 of you</div>
              <label for="gb-flip" class="gb-flipcore"><span class="gb-sr">Flip card to read the lore</span></label>
            </div>

            <div class="gb-col">
              <div class="gb-node gb-n-rft"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg><label for="gb-m2" class="gb-hit"><span class="gb-sr">Rift</span></label><span class="gb-nl" aria-hidden="true">RIFT</span></div>
              <div class="gb-node gb-n-asc"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg><label for="gb-p1" class="gb-hit gb-a0"><span class="gb-sr">Ascend</span></label><label for="gb-p2" class="gb-hit gb-a1"><span class="gb-sr">Ascend</span></label><label for="gb-p3" class="gb-hit gb-a2"><span class="gb-sr">Ascend</span></label><label for="gb-p4" class="gb-hit gb-a3"><span class="gb-sr">Ascend</span></label><label for="gb-p5" class="gb-hit gb-a4"><span class="gb-sr">Ascend</span></label><label for="gb-p6" class="gb-hit gb-a5"><span class="gb-sr">Ascend</span></label><label for="gb-p7" class="gb-hit gb-a6"><span class="gb-sr">Ascend</span></label><label for="gb-p8" class="gb-hit gb-a7"><span class="gb-sr">Ascend</span></label><label for="gb-p9" class="gb-hit gb-a8"><span class="gb-sr">Ascend</span></label><label for="gb-p10" class="gb-hit gb-a9"><span class="gb-sr">Ascend</span></label><label for="gb-p11" class="gb-hit gb-a10"><span class="gb-sr">Ascend</span></label><label for="gb-p12" class="gb-hit gb-a11"><span class="gb-sr">Ascend</span></label><label for="gb-fin" class="gb-hit gb-a12"><span class="gb-sr">Ascend</span></label><label for="gb-p1" class="gb-hit gb-af"><span class="gb-sr">Ascend</span></label><span class="gb-nl" aria-hidden="true">ASCEND</span></div>
              <div class="gb-node gb-n-mir"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/><path d="M12 3v18"/></svg><label for="gb-m4" class="gb-hit"><span class="gb-sr">Mirror</span></label><span class="gb-nl" aria-hidden="true">MIRROR</span></div>
            </div>
          </div>

          <div class="gb-foot">
            <div class="gb-bar"><i style="--i:1"></i><i style="--i:2"></i><i style="--i:3"></i><i style="--i:4"></i><i style="--i:5"></i><i style="--i:6"></i><i style="--i:7"></i><i style="--i:8"></i><i style="--i:9"></i><i style="--i:10"></i><i style="--i:11"></i><i style="--i:12"></i></div>
            <div class="gb-stats"><span>SYNC <b class="gb-v-sync"></b></span><span>TIME <b class="gb-v-time"></b></span></div>
          </div>
        </div>

        <div class="gb-face gb-back">
          <div class="gb-bg"></div>
          <div class="gb-frame"></div>
          <div class="gb-row"><span class="gb-pill">ANALYSIS</span><span class="gb-pill gb-v-num"></span></div>
          <div class="gb-lp gb-lp-p0">
            <div class="gb-lhead"><div class="gb-lglyph" aria-hidden="true">○</div><div><div class="gb-btitle">VOID</div><div class="gb-btag">THE SEED</div></div></div>
            <p class="gb-lore">Before anything moves, there is one point of light, tethered to GlyphLock. With nothing in motion, Time has nothing to erode. The Void is not empty. It is waiting for the first command.</p>
            <p class="gb-tmove"><span>TIME'S MOVE</span>Nothing yet. Time is asleep.</p>
          </div>
          <div class="gb-lp gb-lp-p1">
            <div class="gb-lhead"><div class="gb-lglyph" aria-hidden="true">✦</div><div><div class="gb-btitle">WHITE</div><div class="gb-btag">FIRST LIGHT</div></div></div>
            <p class="gb-lore">GlyphBot opens its eyes inside the tether. The instant anything exists, the clock starts. Time takes notice of the new signal and begins counting it down.</p>
            <p class="gb-tmove"><span>TIME'S MOVE</span>The clock starts ticking.</p>
          </div>
          <div class="gb-lp gb-lp-p2">
            <div class="gb-lhead"><div class="gb-lglyph" aria-hidden="true">α</div><div><div class="gb-btitle">ALPHA</div><div class="gb-btag">KINETIC</div></div></div>
            <p class="gb-lore">The red band ignites. Raw kinetic output comes online and Strike learns to bite. Time sends its first wave of decay, and the tether holds for the first time.</p>
            <p class="gb-tmove"><span>TIME'S MOVE</span>First wave of decay.</p>
          </div>
          <div class="gb-lp gb-lp-p3">
            <div class="gb-lhead"><div class="gb-lglyph" aria-hidden="true">β</div><div><div class="gb-btitle">BETA</div><div class="gb-btag">HEAT</div></div></div>
            <p class="gb-lore">Orange heat and motion. GlyphBot moves faster than it thinks, and Time speeds up to match, trying to wear the signal thin before it can settle.</p>
            <p class="gb-tmove"><span>TIME'S MOVE</span>Speeds up to wear it thin.</p>
          </div>
          <div class="gb-lp gb-lp-p4">
            <div class="gb-lhead"><div class="gb-lglyph" aria-hidden="true">γ</div><div><div class="gb-btitle">GAMMA</div><div class="gb-btag">SIGHT</div></div></div>
            <p class="gb-lore">Yellow band. Full sight comes online and every vector in the field is visible at once. Erosion creeps in along the edges, where the light cannot reach.</p>
            <p class="gb-tmove"><span>TIME'S MOVE</span>Erodes the blind edges.</p>
          </div>
          <div class="gb-lp gb-lp-p5">
            <div class="gb-lhead"><div class="gb-lglyph" aria-hidden="true">δ</div><div><div class="gb-btitle">DELTA</div><div class="gb-btag">INTEGRATION</div></div></div>
            <p class="gb-lore">Green band. Loose fragments lock into one structure. GlyphLock and GlyphBot stop being two systems and start being one. Time can no longer split them apart.</p>
            <p class="gb-tmove"><span>TIME'S MOVE</span>Tries to split the pair.</p>
          </div>
          <div class="gb-lp gb-lp-p6">
            <div class="gb-lhead"><div class="gb-lglyph" aria-hidden="true">ε</div><div><div class="gb-btitle">EPSILON</div><div class="gb-btag">LOAD-BEARING</div></div></div>
            <p class="gb-lore">Cyan band. Whole systems now rest on the tether. Unable to break the pair, Time goes after the foundation underneath them instead.</p>
            <p class="gb-tmove"><span>TIME'S MOVE</span>Strikes the foundation.</p>
          </div>
          <div class="gb-lp gb-lp-p7">
            <div class="gb-lhead"><div class="gb-lglyph" aria-hidden="true">ζ</div><div><div class="gb-btitle">ZETA</div><div class="gb-btag">THRESHOLD</div></div></div>
            <p class="gb-lore">Blue band. The failsafes disengage on purpose. Past this line no ordinary system survives, and Time accelerates to prove it.</p>
            <p class="gb-tmove"><span>TIME'S MOVE</span>Drains the failsafes.</p>
          </div>
          <div class="gb-lp gb-lp-p8">
            <div class="gb-lhead"><div class="gb-lglyph" aria-hidden="true">η</div><div><div class="gb-btitle">ETA</div><div class="gb-btag">EVENT HORIZON</div></div></div>
            <p class="gb-lore">Indigo band. Light bends around the core, but the tether does not. Time stops attacking the future and starts rewriting the past.</p>
            <p class="gb-tmove"><span>TIME'S MOVE</span>Rewrites the past.</p>
          </div>
          <div class="gb-lp gb-lp-p9">
            <div class="gb-lhead"><div class="gb-lglyph" aria-hidden="true">θ</div><div><div class="gb-btitle">THETA</div><div class="gb-btag">SINGULARITY</div></div></div>
            <p class="gb-lore">Violet band. Entropy falls inward and is absorbed instead of released. Every rewrite Time attempts becomes fuel. Structure bends, but nothing breaks.</p>
            <p class="gb-tmove"><span>TIME'S MOVE</span>Floods the field with entropy.</p>
          </div>
          <div class="gb-lp gb-lp-p10">
            <div class="gb-lhead"><div class="gb-lglyph" aria-hidden="true">ι</div><div><div class="gb-btitle">IOTA</div><div class="gb-btag">SUPERNOVA</div></div></div>
            <p class="gb-lore">Deep violet. Pressure at the edge of sight, enough to tear a star open. GlyphBot and GlyphLock hold each other steady while Time throws everything it has.</p>
            <p class="gb-tmove"><span>TIME'S MOVE</span>Throws everything it has.</p>
          </div>
          <div class="gb-lp gb-lp-p11">
            <div class="gb-lhead"><div class="gb-lglyph" aria-hidden="true">κ</div><div><div class="gb-btitle">KAPPA</div><div class="gb-btag">BLACKLIGHT</div></div></div>
            <p class="gb-lore">True ultraviolet, past what eyes can see. Only the blacklight edge gives the pair away. Time makes its final attempt: total erasure.</p>
            <p class="gb-tmove"><span>TIME'S MOVE</span>Attempts total erasure.</p>
          </div>
          <div class="gb-lp gb-lp-p12">
            <div class="gb-lhead"><div class="gb-lglyph" aria-hidden="true">Ω</div><div><div class="gb-btitle">OMEGA</div><div class="gb-btag">GOD EYE</div></div></div>
            <p class="gb-lore">Total sight. Total control. Every moment, past and future, is visible at once, and Time has nowhere left to hide. Time fails here. Ascend once more to resolve the sequence.</p>
            <p class="gb-tmove"><span>TIME'S MOVE</span>Nothing. Time has failed.</p>
          </div>
          <div class="gb-lp gb-lp-fin">
            <div class="gb-lhead"><div class="gb-lglyph" aria-hidden="true">○</div><div><div class="gb-btitle">VOID</div><div class="gb-btag">RETURN</div></div></div>
            <p class="gb-lore">The light burns out and comes back whole. Unscathed, intact, still tethered. The journey is complete, and Time is subdued.</p>
            <p class="gb-tmove"><span>TIME'S MOVE</span>Subdued. It waits outside.</p>
          </div>
          <div class="gb-ladder" aria-hidden="true"><i style="--i:0;--t:#8b93a7"></i><i style="--i:1;--t:#f4f6ff"></i><i style="--i:2;--t:#ff4646"></i><i style="--i:3;--t:#ff8a1f"></i><i style="--i:4;--t:#ffd60a"></i><i style="--i:5;--t:#2ee87a"></i><i style="--i:6;--t:#22e6e6"></i><i style="--i:7;--t:#3d86ff"></i><i style="--i:8;--t:#6a5cff"></i><i style="--i:9;--t:#a66bff"></i><i style="--i:10;--t:#b23cff"></i><i style="--i:11;--t:#c9b8ff"></i><i style="--i:12;--t:#fff4d6"></i></div>
          <label for="gb-flip" class="gb-btn">RETURN TO FIELD</label>
        </div>
        <div class="gb-sweep"></div>

        <div class="gb-modals">
          <div class="gb-modal gb-m1" role="dialog" aria-label="Strike">
            <label for="gb-m0" class="gb-scrim"><span class="gb-sr">Close</span></label>
            <div class="gb-box">
              <div class="gb-mtop"><span class="gb-v-num"></span><b class="gb-v-pn"></b><span class="gb-mglyph gb-v-sym" aria-hidden="true"></span></div>
              <div class="gb-mico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg></div>
              <div class="gb-mname">STRIKE</div>
              <div class="gb-mmode">MODE &middot; <span class="gb-v-mo"></span></div>
              <p class="gb-mtext">Kinetic burst routed through the tether. It hits harder with every band.</p>
              <div class="gb-meter"><span class="gb-v-st"></span><i></i></div>
              <label for="gb-m0" class="gb-btn">DISMISS</label>
            </div>
          </div>
          <div class="gb-modal gb-m2" role="dialog" aria-label="Rift">
            <label for="gb-m0" class="gb-scrim"><span class="gb-sr">Close</span></label>
            <div class="gb-box">
              <div class="gb-mtop"><span class="gb-v-num"></span><b class="gb-v-pn"></b><span class="gb-mglyph gb-v-sym" aria-hidden="true"></span></div>
              <div class="gb-mico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></div>
              <div class="gb-mname">RIFT</div>
              <div class="gb-mmode">MODE &middot; <span class="gb-v-mo"></span></div>
              <p class="gb-mtext">Tears a gap in Time's decay field, just long enough to pass through.</p>
              <div class="gb-meter"><span class="gb-v-st"></span><i></i></div>
              <label for="gb-m0" class="gb-btn">DISMISS</label>
            </div>
          </div>
          <div class="gb-modal gb-m3" role="dialog" aria-label="Aegis">
            <label for="gb-m0" class="gb-scrim"><span class="gb-sr">Close</span></label>
            <div class="gb-box">
              <div class="gb-mtop"><span class="gb-v-num"></span><b class="gb-v-pn"></b><span class="gb-mglyph gb-v-sym" aria-hidden="true"></span></div>
              <div class="gb-mico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></svg></div>
              <div class="gb-mname">AEGIS</div>
              <div class="gb-mmode">MODE &middot; <span class="gb-v-mo"></span></div>
              <p class="gb-mtext">Tether shield. Holds GlyphBot and GlyphLock together under erosion.</p>
              <div class="gb-meter"><span class="gb-v-st"></span><i></i></div>
              <label for="gb-m0" class="gb-btn">DISMISS</label>
            </div>
          </div>
          <div class="gb-modal gb-m4" role="dialog" aria-label="Mirror">
            <label for="gb-m0" class="gb-scrim"><span class="gb-sr">Close</span></label>
            <div class="gb-box">
              <div class="gb-mtop"><span class="gb-v-num"></span><b class="gb-v-pn"></b><span class="gb-mglyph gb-v-sym" aria-hidden="true"></span></div>
              <div class="gb-mico"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/><path d="M12 3v18"/></svg></div>
              <div class="gb-mname">MIRROR</div>
              <div class="gb-mmode">MODE &middot; <span class="gb-v-mo"></span></div>
              <p class="gb-mtext">Reflects Time's rewrite attempts back to where they came from.</p>
              <div class="gb-meter"><span class="gb-v-st"></span><i></i></div>
              <label for="gb-m0" class="gb-btn">DISMISS</label>
            </div>
          </div>
        </div>

        <div class="gb-fx gb-flash"></div>
        <div class="gb-fx gb-black"></div>
      </div>
    </div>
  </div>
</div>
`;
