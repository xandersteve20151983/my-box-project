// app/components/BoxPreview2D.js
"use client";

import { useMemo } from "react";

/**
 * EXPECTED PROPS
 * inputs: {
 *   slotWidth, showPanelLabels, showDimLines, showFlapLabels,
 *   glueLapBevelAngle, glueLapExtensionA, glueLapWidth,
 *   gluePosition,                 // "inside" | "outside" (visual only)
 * }
 * derived: {
 *   P1,P2,P3,P4,                  // panel widths (mm)
 *   glueLap,                      // = glueLapWidth (mm)
 *   blankWidth,                   // total body width (mm) = glueLap + P1..P4
 *   scoreToScore,                 // S2S height (mm)
 *   top:    {P1,P2,P3,P4},        // top flap heights (mm)
 *   bottom: {P1,P2,P3,P4},        // bottom flap heights (mm)
 * }
 */

export default function BoxPreview2D({ inputs, derived }) {
  const {
    slotWidth = 0,
    showPanelLabels = true,
    showDimLines = true,
    showFlapLabels = false,

    glueLapBevelAngle = 24,  // deg
    glueLapExtensionA = 0,   // mm (vertical)
    glueLapWidth = 28,       // mm
    gluePosition = "inside", // visual only; not used in chamfer math
  } = inputs || {};

  const {
    P1 = 0, P2 = 0, P3 = 0, P4 = 0,
    glueLap = glueLapWidth,
    blankWidth: bw = glueLapWidth + P1 + P2 + P3 + P4,
    scoreToScore: bh = 0,
    top   = { P1: 0, P2: 0, P3: 0, P4: 0 },
    bottom= { P1: 0, P2: 0, P3: 0, P4: 0 },
  } = derived || {};

  // ── layout (mm) ─────────────────────────────────────────
  const pad = 24;                     // svg padding (px, but used in viewBox only)
  const xGlue = 0;                    // glue-lap begins at 0
  const xP1 = xGlue + glueLap;
  const xP2 = xP1 + P1;
  const xP3 = xP2 + P2;
  const xP4 = xP3 + P3;
  const xEnd = xP4 + P4;

  const maxTop = Math.max(top.P1, top.P2, top.P3, top.P4);
  const maxBot = Math.max(bottom.P1, bottom.P2, bottom.P3, bottom.P4);
  const totalH = maxTop + bh + maxBot;

  const viewBox = useMemo(
    () => `0 0 ${bw + pad * 2} ${totalH + pad * 2}`,
    [bw, totalH]
  );
  const yScoreTop = pad + maxTop;     // Y of top score (px in viewBox coords)

  // vertical score X positions (mm; converted by viewBox automatically)
  const scoresX = [xP1, xP2, xP3, xP4, xEnd];

  // ── helpers ─────────────────────────────────────────────
  const mmLabel = (n) => `${round2(n)} mm`;
  function round2(n){ return Math.round((+n + Number.EPSILON)*100)/100; }

  // Generic rectangular flap (for panels P1..P4). We SKIP glue-lap polygon.
  const flapPath = (x0, w, h, isTop) => {
    const yBase = isTop ? yScoreTop : yScoreTop + bh;
    const dir   = isTop ? -1 : +1;
    const tipY  = yBase + dir * h;
    const x1 = pad + x0;
    const x2 = pad + x0 + w;
    return `M ${x1},${yBase} L ${x2},${yBase} L ${x2},${tipY} L ${x1},${tipY} Z`;
  };

  const DimLine = ({ x1, y1, x2, y2, label, offset = 10 }) => {
    const midx = (x1 + x2) / 2;
    return (
      <>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2e7d32" strokeDasharray="4 4" strokeWidth="1" />
        <line x1={x1} y1={y1} x2={x1} y2={y1 + offset} stroke="#2e7d32" strokeWidth="1" />
        <line x1={x2} y1={y2} x2={x2} y2={y2 + offset} stroke="#2e7d32" strokeWidth="1" />
        <text x={midx} y={y1 + 16} fontSize="12" textAnchor="middle" fill="#1b5e20">{mmLabel(label)}</text>
      </>
    );
  };

  // Slot rectangles centered on every vertical score (including glue score)
  const SlotRects = () => {
    if (!(slotWidth > 0)) return null;
    const depth = 16;                       // how far into flap the notch shows (mm)
    const half  = slotWidth / 2;
    const allScores = [xP1, xP2, xP3, xP4, xEnd];

    return (
      <>
        {allScores.map((x, i) => {
          const sx = pad + x;
          return (
            <g key={`slot-${i}`}>
              {/* top notch */}
              <rect
                x={sx - half}
                y={yScoreTop - depth}
                width={slotWidth}
                height={depth}
                fill="#fff"
                stroke="#222"
                strokeWidth="1.2"
              />
              {/* bottom notch */}
              <rect
                x={sx - half}
                y={yScoreTop + bh}
                width={slotWidth}
                height={depth}
                fill="#fff"
                stroke="#222"
                strokeWidth="1.2"
              />
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

        {/* main S2S body */}
        <rect x={pad + xGlue} y={yScoreTop} width={bw} height={bh} fill="#fff" stroke="#333" strokeWidth="1" />

        {/* RED crease lines */}
        <line x1={pad + xGlue} y1={yScoreTop}     x2={pad + xEnd} y2={yScoreTop}     stroke="#c62828" strokeWidth="1" />
        <line x1={pad + xGlue} y1={yScoreTop + bh} x2={pad + xEnd} y2={yScoreTop + bh} stroke="#c62828" strokeWidth="1" />

        {/* vertical scores (dashed) */}
        {scoresX.map((x, i) => (
          <line key={`vs-${i}`} x1={pad + x} y1={yScoreTop} x2={pad + x} y2={yScoreTop + bh} stroke="#777" strokeDasharray="6 6" strokeWidth="1" />
        ))}

        {/* ===================== GLUE-LAP: CHAMFERS ===================== */}
        {(() => {
          // Glue score (inside edge of glue-lap) and outer sheet edge:
          const glueScoreX = pad + xGlue + glueLap;    // where glue meets P1
          const outerX     = pad;                      // sheet outer left

          // Where the chamfers start: at the glue score, left side of slot if any
          const half = slotWidth > 0 ? (slotWidth / 2) : 0;
          const startX = glueScoreX - half;

          // Base edges (mm→viewBox): where the glue flap meets the body
          const yTopEdge = yScoreTop - top.P1;
          const yBotEdge = yScoreTop + bh + bottom.P1;

          // Vertical change: if "a" > 0 use that; otherwise tan(angle) * (horizontal run)
          const run = Math.max(0, startX - outerX);
          const autoV = Math.tan((Math.max(0, glueLapBevelAngle) * Math.PI) / 180) * run;
          const vChange = glueLapExtensionA > 0 ? glueLapExtensionA : autoV;

          const yChamferTop = yTopEdge + vChange;   // downward positive
          const yChamferBot = yBotEdge - vChange;

          return (
            <>
              {/* Short vertical between chamfers if they don't meet */}
              {yChamferBot > yChamferTop && (
                <line x1={outerX} y1={yChamferTop} x2={outerX} y2={yChamferBot} stroke="#666" strokeWidth="1" />
              )}

              {/* Top chamfer: from glue score/slot start to outer edge */}
              <line x1={startX} y1={yTopEdge} x2={outerX} y2={yChamferTop} stroke="#666" strokeWidth="1" />
              {/* Bottom chamfer */}
              <line x1={startX} y1={yBotEdge} x2={outerX} y2={yChamferBot} stroke="#666" strokeWidth="1" />
            </>
          );
        })()}

        {/* ===================== TOP/BOTTOM FLAPS (P1..P4) ===================== */}
        {/* We do NOT draw a polygon for the glue-lap; only P1..P4 */}
        <path d={flapPath(xP1, P1, top.P1, true)}   fill="#fff" stroke="#666" strokeWidth="1" transform={`translate(${pad},0)`} />
        <path d={flapPath(xP2, P2, top.P2, true)}   fill="#fff" stroke="#666" strokeWidth="1" transform={`translate(${pad - xP2},0)`} />
        <path d={flapPath(xP3, P3, top.P3, true)}   fill="#fff" stroke="#666" strokeWidth="1" transform={`translate(${pad - xP3},0)`} />
        <path d={flapPath(xP4, P4, top.P4, true)}   fill="#fff" stroke="#666" strokeWidth="1" transform={`translate(${pad - xP4},0)`} />

        <path d={flapPath(xP1, P1, bottom.P1, false)} fill="#fff" stroke="#666" strokeWidth="1" transform={`translate(${pad},0)`} />
        <path d={flapPath(xP2, P2, bottom.P2, false)} fill="#fff" stroke="#666" strokeWidth="1" transform={`translate(${pad - xP2},0)`} />
        <path d={flapPath(xP3, P3, bottom.P3, false)} fill="#fff" stroke="#666" strokeWidth="1" transform={`translate(${pad - xP3},0)`} />
        <path d={flapPath(xP4, P4, bottom.P4, false)} fill="#fff" stroke="#666" strokeWidth="1" transform={`translate(${pad - xP4},0)`} />

        {/* SLOT RECTS (drawn after flaps so they sit on top) */}
        <SlotRects />

        {/* Panel labels */}
        {showPanelLabels && (
          <>
            <text x={pad + xP1 + P1 / 2} y={yScoreTop + bh / 2} textAnchor="middle" fontSize="13">P1 (L)</text>
            <text x={pad + xP2 + P2 / 2} y={yScoreTop + bh / 2} textAnchor="middle" fontSize="13">P2 (W)</text>
            <text x={pad + xP3 + P3 / 2} y={yScoreTop + bh / 2} textAnchor="middle" fontSize="13">P3 (L)</text>
            <text x={pad + xP4 + P4 / 2} y={yScoreTop + bh / 2} textAnchor="middle" fontSize="13">P4 (W)</text>
            <text x={pad + glueLap / 2}      y={yScoreTop + bh / 2} textAnchor="middle" fontSize="13">Glue-lap</text>
          </>
        )}

        {/* Flap hint labels (optional) */}
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

        {/* Green dimension lines */}
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
