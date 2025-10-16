// app/components/BoxPreview2D.js
"use client";

import { useMemo } from "react";

export default function BoxPreview2D({ inputs, derived }) {
  const {
    slotWidth,
    showPanelLabels,
    showDimLines,
    showFlapLabels,
    glueLapBevelAngle,   // degrees from horizontal
    glueLapExtensionA,   // mm (vertical)
    glueLapWidth,        // mm
    gluePosition,        // "inside" | "outside" (visual)
  } = inputs;

  const {
    P1, P2, P3, P4,
    glueLap,               // == glueLapWidth (NO +a)
    blankWidth: bw,
    scoreToScore: bh,
    top, bottom,
  } = derived;

  // ── layout (mm) ─────────────────────────────────────────
  const pad = 24;
  const xGlue = 0;
  const xP1 = xGlue + glueLap;
  const xP2 = xP1 + P1;
  const xP3 = xP2 + P2;
  const xP4 = xP3 + P3;
  const xEnd = xP4 + P4;
  const vScores = [xP1, xP2, xP3, xP4, xEnd];

  const maxTop = Math.max(top.P1, top.P2, top.P3, top.P4);
  const maxBot = Math.max(bottom.P1, bottom.P2, bottom.P3, bottom.P4);
  const totalH = maxTop + bh + maxBot;

  const viewBox = useMemo(
    () => `0 0 ${bw + pad * 2} ${totalH + pad * 2}`,
    [bw, totalH]
  );
  const yScoreTop = pad + maxTop;

  // ── helpers ─────────────────────────────────────────────
  // Robust glue-lap flap: vertical "a" and bevel clamped by magnitude.
  const flapPath = (x0, w, h, isTop, isGlueLapCol) => {
    const yBase = isTop ? yScoreTop : yScoreTop + bh;
    const dir   = isTop ? -1 : +1;                 // up for top, down for bottom

    // Vertical extension only on glue-lap flaps
    const a = isGlueLapCol ? Math.max(0, glueLapExtensionA) : 0;
    const tipY = yBase + dir * (h + a);

    // Bevel run (absolute), then apply sign AFTER clamping
    let run = 0;
    if (isGlueLapCol && glueLapBevelAngle) {
      const absRun = Math.tan((glueLapBevelAngle * Math.PI) / 180) * Math.min(h + a, glueLapWidth);
      const clampedAbs = Math.min(Math.max(absRun, 0), Math.max(w - 1, 0)); // never ≥ width
      let sign = 1;
      if (gluePosition === "outside") sign *= -1;  // outside flips vs inside
      if (isTop)                   sign *= -1;     // top flips vs bottom (visual)
      run = sign * clampedAbs;
    }

    const x1 = x0;
    const x2 = x0 + w;
    const xFreeTip = x2 + run; // free-edge X at the tip

    // Keep the polygon simple, non-self-intersecting
    // base: (x1,yBase)->(x2,yBase); free edge: (xFreeTip,tipY); back: (x1,tipY)
    return `M ${x1},${yBase} L ${x2},${yBase} L ${xFreeTip},${tipY} L ${x1},${tipY} Z`;
  };

  const DimLine = ({ x1, y1, x2, y2, label, offset = 10 }) => {
    const midx = (x1 + x2) / 2;
    return (
      <>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2e7d32" strokeDasharray="4 4" strokeWidth="1" />
        <line x1={x1} y1={y1} x2={x1} y2={y1 + offset} stroke="#2e7d32" strokeWidth="1" />
        <line x1={x2} y1={y2} x2={x2} y2={y2 + offset} stroke="#2e7d32" strokeWidth="1" />
        <text x={midx} y={y1 + 16} fontSize="12" textAnchor="middle" fill="#1b5e20">
          {mm(label)}
        </text>
      </>
    );
  };

  // Slot notches as visible rectangles, drawn LAST so they sit on top
  const SlotNotches = () => {
    if (!(slotWidth > 0)) return null;
    const depth = 16;            // mm into each flap for visibility
    const half  = slotWidth / 2;

    return (
      <>
        {vScores.map((x, i) => {
          const sx = pad + x;
          return (
            <g key={`notch-${i}`}>
              <rect x={sx - half} y={yScoreTop - depth} width={slotWidth} height={depth}
                    fill="#fff" stroke="#222" strokeWidth="1.2" />
              <rect x={sx - half} y={yScoreTop + bh} width={slotWidth} height={depth}
                    fill="#fff" stroke="#222" strokeWidth="1.2" />
            </g>
          );
        })}
      </>
    );
  };

  // ── render ──────────────────────────────────────────────
  return (
    <div className="w-full overflow-auto border rounded-xl p-2 bg-white">
      <svg viewBox={viewBox} className="w-full h-[520px]" role="img" aria-label="2D RSC Blank">
        {/* background */}
        <rect x="0" y="0" width={bw + pad * 2} height={totalH + pad * 2} fill="#fafafa" />

        {/* main body (score-to-score) */}
        <rect x={pad + xGlue} y={yScoreTop} width={bw} height={bh} fill="#fff" stroke="#333" strokeWidth="1" />

        {/* red crease lines */}
        <line x1={pad + xGlue} y1={yScoreTop}     x2={pad + xEnd} y2={yScoreTop}     stroke="#c62828" strokeWidth="1" />
        <line x1={pad + xGlue} y1={yScoreTop + bh} x2={pad + xEnd} y2={yScoreTop + bh} stroke="#c62828" strokeWidth="1" />

        {/* TOP flaps */}
        <path d={flapPath(pad + xGlue, glueLap, top.P1, true,  true)}  fill="#fff" stroke="#666" strokeWidth="1" />
        <path d={flapPath(pad + xP1,   P1,      top.P1, true,  false)} fill="#fff" stroke="#666" strokeWidth="1" />
        <path d={flapPath(pad + xP2,   P2,      top.P2, true,  false)} fill="#fff" stroke="#666" strokeWidth="1" />
        <path d={flapPath(pad + xP3,   P3,      top.P3, true,  false)} fill="#fff" stroke="#666" strokeWidth="1" />
        <path d={flapPath(pad + xP4,   P4,      top.P4, true,  false)} fill="#fff" stroke="#666" strokeWidth="1" />

        {/* BOTTOM flaps */}
        <path d={flapPath(pad + xGlue, glueLap, bottom.P1, false, true)}  fill="#fff" stroke="#666" strokeWidth="1" />
        <path d={flapPath(pad + xP1,   P1,      bottom.P1, false, false)} fill="#fff" stroke="#666" strokeWidth="1" />
        <path d={flapPath(pad + xP2,   P2,      bottom.P2, false, false)} fill="#fff" stroke="#666" strokeWidth="1" />
        <path d={flapPath(pad + xP3,   P3,      bottom.P3, false, false)} fill="#fff" stroke="#666" strokeWidth="1" />
        <path d={flapPath(pad + xP4,   P4,      bottom.P4, false, false)} fill="#fff" stroke="#666" strokeWidth="1" />

        {/* vertical score lines */}
        {vScores.map((x, i) => (
          <line
            key={`score-${i}`}
            x1={pad + x}
            y1={yScoreTop}
            x2={pad + x}
            y2={yScoreTop + bh}
            stroke="#777"
            strokeDasharray="6 6"
            strokeWidth="1"
          />
        ))}

        {/* slot notches (on top) */}
        <SlotNotches />

        {/* labels */}
        {showPanelLabels && (
          <>
            <text x={pad + xP1 + P1 / 2} y={yScoreTop + bh / 2} textAnchor="middle" fontSize="13">P1 (L)</text>
            <text x={pad + xP2 + P2 / 2} y={yScoreTop + bh / 2} textAnchor="middle" fontSize="13">P2 (W)</text>
            <text x={pad + xP3 + P3 / 2} y={yScoreTop + bh / 2} textAnchor="middle" fontSize="13">P3 (L)</text>
            <text x={pad + xP4 + P4 / 2} y={yScoreTop + bh / 2} textAnchor="middle" fontSize="13">P4 (W)</text>
            <text x={pad + glueLap / 2} y={yScoreTop + bh / 2} textAnchor="middle" fontSize="13">Glue-lap</text>
          </>
        )}

        {showFlapLabels && (
          <>
            <text x={pad + xP2 + P2 / 2} y={yScoreTop - top.P2 - 6} textAnchor="middle" fontSize="11">
              Top P2 = W/2 + allowance − outer gap/2
            </text>
            <text x={pad + xP1 + P1 / 2} y={yScoreTop - top.P1 - 6} textAnchor="middle" fontSize="11">
              Top P1 = L/2 + allowance − inner gap/2
            </text>
          </>
        )}

        {/* dimensions */}
        {showDimLines && (
          <>
            <DimLine x1={pad + xGlue} y1={pad + totalH} x2={pad + xEnd} y2={pad + totalH} label={bw} offset={12} />
            <DimLine x1={pad + xEnd + 18} y1={yScoreTop} x2={pad + xEnd + 18} y2={yScoreTop + bh} label={bh} offset={0} />
            <DimLine x1={pad + xP1} y1={pad + totalH - 30} x2={pad + xP2} y2={pad + totalH - 30} label={P1} offset={10} />
            <DimLine x1={pad + xP2} y1={pad + totalH - 30} x2={pad + xP3} y2={pad + totalH - 30} label={P2} offset={10} />
            <DimLine x1={pad + xP3} y1={pad + totalH - 30} x2={pad + xP4} y2={pad + totalH - 30} label={P3} offset={10} />
            <DimLine x1={pad + xP4} y1={pad + totalH - 30} x2={pad + xEnd} y2={pad + totalH - 30} label={P4} offset={10} />
          </>
        )}
      </svg>
    </div>
  );
}

function mm(n) {
  return `${Math.round((n + Number.EPSILON) * 100) / 100} mm`;
}
