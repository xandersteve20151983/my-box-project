/* === REPLACE these three functions in BoxPreview.js === */

// 0204 — CSSC: center-special; flaps meet in the middle along the LENGTH.
// Flap height uses L/2 (not W/2 like 0201).
function compute0204(L, W, H) {
  const flap = Math.round(L / 2);
  return mkModel(
    "0204",
    L, W, H,
    flap, flap,
    "0204 CSSC: top/bottom flaps ≈ L/2 (center-special along length)"
  );
}

// 0205 — Center-Special Overlap: flaps overlap along LENGTH.
// Use ~0.75·L for a partial overlap default. Change to L for full overlap if your spec requires.
function compute0205(L, W, H) {
  const flap = Math.round(L * 0.75);   // change to: const flap = L;  // for full-length overlap
  return mkModel(
    "0205",
    L, W, H,
    flap, flap,
    "0205 CS-Overlap: top/bottom flaps ≈ 0.75·L (overlap along length)"
  );
}

// 0206 — Half-Slotted Center-Special: one side open, the other center-special.
// Default: bottom open (0), top flaps meet in middle along LENGTH.
function compute0206(L, W, H) {
  const topFlap = Math.round(L / 2);
  const bottomFlap = 0;
  return mkModel(
    "0206",
    L, W, H,
    topFlap, bottomFlap,
    "0206 HSC-CSSC: top flap ≈ L/2, bottom flap = 0 (open)"
  );
}
