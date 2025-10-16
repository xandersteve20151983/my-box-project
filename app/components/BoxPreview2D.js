// app/components/BoxPreview2D.js
"use client";

import { useMemo } from "react";

export default function BoxPreview2D({ inputs, derived }) {
  // ---------- inputs ----------
  const {
    slotWidth = 0,
    showPanelLabels = true,
    showDimLines = true,
    showFlapLabels = false,
    glueLapBevelAngle = 30,     // degrees
    glueLapExtensionA = 0,      // mm (vertical)
    glueLapWidth = 35,          // mm
    gluePosition = "inside",    // visual only (not used in chamfer math)
  } = inputs || {};

  // ---------- derived geometry (all in mm) ----------
  const {
    P1 = 0, P2 = 0, P3 = 0, P4 = 0,
    glueLap = glueLapWidth,
    blankWidth: bw = glueLapWidth + P1 + P2 + P3 + P4,
    scoreToScore: bh = 0,
    top    = { P1: 0, P2: 0, P3: 0, P4: 0 },
    bottom = { P1: 0, P2: 0, P3: 0, P4: 0 },
  } = derived || {};

  // ---------- layout (mm) ----------
  // We treat the viewBox units as mm so everything is consistent.
  const PAD = 20; // mm padding around drawing

  // X positions of columns (mm from start of body)
  const xGlue = 0;                // glue-lap starts at x=0
  const xP1 = xGlue + glueLap;
  const xP2 = xP1 + P1;
  const xP3 = xP2 + P2;
  const xP4 = xP3 + P3;
  const xEnd = xP4 + P4;

  const maxTop = Math.max(top.P1, top.P2, top.P3, top.P4);
  const maxBot = Math.max(bottom.P1, bottom.P2, bottom.P3, bottom.P4);
  const totalH = maxTop + bh + maxBot;

  const viewBox = useMemo(
    () => `0 0 ${bw + PAD * 2} ${totalH + PAD * 2}`,
    [bw, totalH]
  );

  // Y of scores in viewBox
  const yScoreTop = PAD + maxTop;      // mm
  const yScoreBot = yScoreTop + bh;    // mm

  // Vertical score Xs (for dashed scores and slot centres)
  const vScores = [xP1, xP2, xP3, xP4];

  // ---------- helpers ----------
  const mmTxt = (n) => `${Math.round((+n + Number.EPSILON) * 100) / 100} mm`;

  // Rectangular panel flap (P1..P4 only — we skip glue-lap polygon)
  const flapPath = (colX, width, height, isTop) => {
    const baseY = isTop ? yScoreTop : yScoreBot;
    const tipY  = isTop ? baseY - height : baseY + height;
    const x1 = PAD + colX;
    const x2 = PAD + colX + width;
    return `M ${x1},${baseY} L ${x2},${baseY} L ${x2},${tipY} L ${x1},${tipY} Z`;
    // (no transforms; all absolute in mm-like units)
  };

  const DimLine = ({ x1, y1, x2, y2, label, offset = 10 }) => {
    const midx = (x1 + x2) / 2;
    return (
      <>
        <line x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#2e7d32" strokeDasharray="4 4" strokeWidth="1" />
        <line x1={x1} y1={y1} x2={x1} y2={y1 + offset}
              stroke="#2e7d32" strokeWidth="1" />
        <line x1={x2} y1={y2} x2={x2} y2={y2 + offset}
              stroke="#2e7d32" strokeWidth="1" />
        <text x={midx} y={y1 + 16} fontSize="12" textAnchor="middle" fill="#1b5e20">
          {mmTxt(label)}
        </text>
      </>
    );
  };

  // Slot rectangles centred at each vertical score (+ glue score is xP1)
  const SlotRects = () => {
    if (!(slotWidth > 0)) return null;
    const half = slotWidth / 2;
    const depth = 12; // how far into flap the slot is drawn (mm)
    return (
      <>
        {[xP1, xP2, xP3, xP4].map((x, i) => {
          const sx = PAD + x;
          return (
            <g key={`slot-${i}`}>
              <rect x={sx - half} y={yScoreTop - depth} width={slotWidth} height={depth}
                    fill="#fff" stroke="#222" strokeWidth="1.2" />
              <rect x={sx - half} y={yScoreBot} width={slotWidth} height={depth}
                    fill="#fff" stroke="#222" strokeWidth="1.2" />
            </g>
          );
        })}
      </>
    );
  };

  // ---------- glue-lap chamfers (old behaviour) ----------
  const GlueChamfers = () => {
    // inner glue score (where glue meets P1) and outer sheet edge
    const glueScoreX = PAD + xP1;    // mm in viewBox
    const outerX     = PAD + xGlue;  // leftmost edge of sheet

    // chamfer starts at the glue score; if a slot exists use left side of slot
    const half = slotWidth > 0 ? (slotWidth / 2) : 0;
    const startX = glueScoreX - half;

    // edges (where glue flap meets body) – use P1 flap heights
    const yTopEdge = yScoreTop - top.P1;
    const yBotEdge = yScoreBot + bottom.P1;

    // vertical change: a if provided, otherwise tan(angle) * horizontal run
    const run = Math.max(0, startX - outerX);
    const autoV = Math.tan(Math.max(0, glueLapBevelAngle) * Math.PI / 180) * run;
    const vChange = glueLapExtensionA > 0 ? glueLapExtensionA : autoV;

    const yChamferTop = yTopEdge + vChange;
    const yChamferBot = yBotEdge - vChange;

    return (
      <>
        {yChamferBot > yChamferTop && (
          <line x1={outerX} y1={yChamferTop} x2={outerX} y2={yChamferBot}
                stroke="#666" strokeWidth="1" />
        )}
        <line x1={startX} y1={yTopEdge} x2={outerX} y2={yChamferTop}
              stroke="#666" strokeWidth="1" />
        <line x1={startX} y1={yBotEdge} x2={outerX} y2={yChamferBot}
              stroke="#666" strokeWidth="1" />
      </>
    );
  };

  // ---------- render ----------
  return (
    <div className="w-full overflow-auto border rounded-xl p-2 bg-white">
      <svg viewBox={viewBox} className="w-full h-[520px]" role="img" aria-label="2D RSC Blank">
        {/* background */}
        <rect x="0" y="0" width={bw + PAD * 2} height={totalH + PAD * 2} fill="#fafafa" />

        {/* body (S2S) */}
        <rect x={PAD} y={yScoreTop} width={bw} height={bh} fill="#fff" stroke="#333" strokeWidth="1" />

        {/* red crease lines */}
        <line x1={PAD}      y1={yScoreTop} x2={PAD + xEnd} y2={yScoreTop}   stroke="#c62828" strokeWidth="1" />
        <line x1={PAD}      y1={yScoreBot} x2={PAD + xEnd} y2={yScoreBot}   stroke="#c62828" strokeWidth="1" />

        {/* dashed vertical scores */}
        {[xP1, xP2, xP3, xP4, xEnd].map((x, i) => (
          <line key={`vs-${i}`} x1={PAD + x} y1={yScoreTop} x2={PAD + x} y2={yScoreBot}
                stroke="#777" strokeDasharray="6 6" strokeWidth="1" />
        ))}

        {/* glue-lap chamfers on outer left edge */}
        <GlueChamfers />

        {/* TOP flaps for P1..P4 (glue-lap polygon intentionally skipped) */}
        <path d={flapPath(xP1, P1, top.P1, true)}   fill="#fff" stroke="#666" strokeWidth="1" />
        <path d={flapPath(xP2, P2, top.P2, true)}   fill="#fff" stroke="#666" strokeWidth="1" />
        <path d={flapPath(xP3, P3, top.P3, true)}   fill="#fff" stroke="#666" strokeWidth="1" />
        <path d={flapPath(xP4, P4, top.P4, true)}   fill="#fff" stroke="#666" strokeWidth="1" />

        {/* BOTTOM flaps */}
        <path d={flapPath(xP1, P1, bottom.P1, false)} fill="#fff" stroke="#666" strokeWidth="1" />
        <path d={flapPath(xP2, P2, bottom.P2, false)} fill="#fff" stroke="#666" strokeWidth="1" />
        <path d={flapPath(xP3, P3, bottom.P3, false)} fill="#fff" stroke="#666" strokeWidth="1" />
        <path d={flapPath(xP4, P4, bottom.P4, false)} fill="#fff" stroke="#666" strokeWidth="1" />

        {/* slot rectangles (draw last so they sit on top) */}
        <SlotRects />

        {/* panel labels */}
        {showPanelLabels && (
          <>
            <text x={PAD + xP1 + P1 / 2} y={yScoreTop + bh / 2} textAnchor="middle" fontSize="13">P1 (L)</text>
            <text x={PAD + xP2 + P2 / 2} y={yScoreTop + bh / 2} textAnchor="middle" fontSize="13">P2 (W)</text>
            <text x={PAD + xP3 + P3 / 2} y={yScoreTop + bh / 2} textAnchor="middle" fontSize="13">P3 (L)</text>
            <text x={PAD + xP4 + P4 / 2} y={yScoreTop + bh / 2} textAnchor="middle" fontSize="13">P4 (W)</text>
            <text x={PAD + glueLap / 2}      y={yScoreTop + bh / 2} textAnchor="middle" fontSize="13">Glue-lap</text>
          </>
        )}

        {/* small flap formulas (optional) */}
        {showFlapLabels && (
          <>
            <text x={PAD + xP2 + P2 / 2} y={yScoreTop - top.P2 - 6} textAnchor="middle" fontSize="11">
              Top P2 = W/2 + allowance − outer gap/2
            </text>
            <text x={PAD + xP1 + P1 / 2} y={yScoreTop - top.P1 - 6} textAnchor="middle" fontSize="11">
              Top P1 = L/2 + allowance − inner gap/2
            </text>
          </>
        )}

        {/* green dimension lines */}
        {showDimLines && (
          <>
            {/* overall width (bottom) */}
            <DimLine x1={PAD} y1={PAD + totalH - 6} x2={PAD + xEnd} y2={PAD + totalH - 6} label={bw} offset={10} />
            {/* S2S on far right */}
            <DimLine x1={PAD + xEnd + 18} y1={yScoreTop} x2={PAD + xEnd + 18} y2={yScoreBot} label={bh} offset={0} />
            {/* panel widths along bottom */}
            <DimLine x1={PAD + xP1} y1={PAD + totalH - 26} x2={PAD + xP2} y2={PAD + totalH - 26} label={P1} offset={10} />
            <DimLine x1={PAD + xP2} y1={PAD + totalH - 26} x2={PAD + xP3} y2={PAD + totalH - 26} label={P2} offset={10} />
            <DimLine x1={PAD + xP3} y1={PAD + totalH - 26} x2={PAD + xP4} y2={PAD + totalH - 26} label={P3} offset={10} />
            <DimLine x1={PAD + xP4} y1={PAD + totalH - 26} x2={PAD + xEnd} y2={PAD + totalH - 26} label={P4} offset={10} />
          </>
        )}
      </svg>
    </div>
  );
}
