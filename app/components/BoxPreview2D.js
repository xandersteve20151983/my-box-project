// app/components/BoxPreview2D.js
"use client";

import { useMemo } from "react";

export default function BoxPreview2D({ inputs, derived }) {
  const {
    slotWidth,
    showPanelLabels,
    showDimLines,
    showFlapLabels,
    glueLapBevelAngle, // visual only
  } = inputs;

  const {
    P1, P2, P3, P4,
    glueLap,            // NOTE: equals glueLapWidth (no + a)
    blankWidth: bw,
    scoreToScore: bh,
    top,
    bottom,
  } = derived;

  // ---------- layout ----------
  const padding = 24;
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
    () => `0 0 ${bw + padding * 2} ${totalH + padding * 2}`,
    [bw, totalH]
  );

  const originY = padding + maxTop; // y of upper score line

  // ---------- helpers ----------
  // Flap path with bevel + “a” nib ONLY on glue-lap flaps (NOT in panel width)
  const makeFlapPath = (x0, width, height, isTop) => {
    const { glueLapWidth, glueLapExtensionA } = inputs;

    const yBase = isTop ? originY : originY + bh;
    const dir = isTop ? -1 : +1;
    const flapY = yBase + dir * height;

    const isGlueLap = width === glueLap;

    // Bevel run along X for the glue-lap flap edge (visual only)
    const bevelX = isGlueLap
      ? Math.tan((glueLapBevelAngle * Math.PI) / 180) *
        Math.min(height, glueLapWidth)
      : 0;

    // Base rectangle corners
    const x1 = x0;
    const x2 = x0 + width;
    const y1 = yBase;
    const y2 = flapY;

    // Beveled far side for glue-lap only
    const x2b = isGlueLap && bevelX !== 0 ? (isTop ? x2 - bevelX : x2 + bevelX) : x2;

    // “a” extension (nib) belongs ONLY on glue-lap FLAPS
    const a = isGlueLap ? Math.max(0, glueLapExtensionA) : 0;

    if (!isGlueLap || a === 0) {
      return `M ${x1},${y1} L ${x2},${y1} L ${x2b},${y2} L ${x1},${y2} Z`;
    }

    // With extension “a”: add a small nib beyond the beveled tip.
    const x2e = isTop ? x2b - a : x2b + a;

    return [
      `M ${x1},${y1}`,
      `L ${x2},${y1}`,
      `L ${x2b},${y2}`,
      `L ${x2e},${y2}`,
      `L ${x1},${y2}`,
      "Z",
    ].join(" ");
  };

  const DimLine = ({ x1, y1, x2, y2, label, offset = 10 }) => {
    const midx = (x1 + x2) / 2;
    return (
      <>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2e7d32" strokeDasharray="4 4" />
        <line x1={x1} y1={y1} x2={x1} y2={y1 + offset} stroke="#2e7d32" />
        <line x1={x2} y1={y2} x2={x2} y2={y2 + offset} stroke="#2e7d32" />
        <text x={midx} y={y1 + 16} fontSize="12" textAnchor="middle" fill="#1b5e20">
          {round(label)} mm
        </text>
      </>
    );
  };

  // ---------- render ----------
  return (
    <div className="w-full overflow-auto border rounded-xl p-2 bg-white">
      <svg viewBox={viewBox} className="w-full h-[520px]" role="img" aria-label="2D RSC Blank">
        {/* Background */}
        <rect x="0" y="0" width={bw + padding * 2} height={totalH + padding * 2} fill="#fafafa" />

        {/* TOP FLAPS */}
        <path d={makeFlapPath(xGlue + padding, glueLap, top.P1, true)} fill="#fff" stroke="#999" />
        <path d={makeFlapPath(xP1 + padding, P1, top.P1, true)} fill="#fff" stroke="#999" />
        <path d={makeFlapPath(xP2 + padding, P2, top.P2, true)} fill="#fff" stroke="#999" />
        <path d={makeFlapPath(xP3 + padding, P3, top.P3, true)} fill="#fff" stroke="#999" />
        <path d={makeFlapPath(xP4 + padding, P4, top.P4, true)} fill="#fff" stroke="#999" />

        {/* MAIN BLANK (score-to-score) */}
        <rect x={padding + xGlue} y={originY} width={bw} height={bh} fill="#fff" stroke="#333" />

        {/* Vertical scores + slot markers */}
        {vScores.map((x, i) => (
          <g key={i}>
            <line
              x1={padding + x}
              y1={originY}
              x2={padding + x}
              y2={originY + bh}
              stroke="#777"
              strokeDasharray="6 6"
            />
            {slotWidth > 0 && (
              <>
                <line
                  x1={padding + x}
                  y1={originY - Math.min(12, slotWidth)}
                  x2={padding + x}
                  y2={originY}
                  stroke="#444"
                />
                <line
                  x1={padding + x}
                  y1={originY + bh}
                  x2={padding + x}
                  y2={originY + bh + Math.min(12, slotWidth)}
                  stroke="#444"
                />
              </>
            )}
          </g>
        ))}
        {/* Glue-lap left edge */}
        <line x1={padding + xGlue} y1={originY} x2={padding + xGlue} y2={originY + bh} stroke="#444" />

        {/* BOTTOM FLAPS */}
        <path d={makeFlapPath(xGlue + padding, glueLap, bottom.P1, false)} fill="#fff" stroke="#999" />
        <path d={makeFlapPath(xP1 + padding, P1, bottom.P1, false)} fill="#fff" stroke="#999" />
        <path d={makeFlapPath(xP2 + padding, P2, bottom.P2, false)} fill="#fff" stroke="#999" />
        <path d={makeFlapPath(xP3 + padding, P3, bottom.P3, false)} fill="#fff" stroke="#999" />
        <path d={makeFlapPath(xP4 + padding, P4, bottom.P4, false)} fill="#fff" stroke="#999" />

        {/* Panel labels */}
        {showPanelLabels && (
          <>
            <text x={padding + xP1 + P1 / 2} y={originY + bh / 2} textAnchor="middle" fontSize="13">P1 (L)</text>
            <text x={padding + xP2 + P2 / 2} y={originY + bh / 2} textAnchor="middle" fontSize="13">P2 (W)</text>
            <text x={padding + xP3 + P3 / 2} y={originY + bh / 2} textAnchor="middle" fontSize="13">P3 (L)</text>
            <text x={padding + xP4 + P4 / 2} y={originY + bh / 2} textAnchor="middle" fontSize="13">P4 (W)</text>
            <text x={padding + glueLap / 2} y={originY + bh / 2} textAnchor="middle" fontSize="13">Glue-lap</text>
          </>
        )}

        {/* Flap labels */}
        {showFlapLabels && (
          <>
            <text x={padding + xP2 + P2 / 2} y={originY - top.P2 - 6} textAnchor="middle" fontSize="11">
              Top P2 = W/2 + allowance − (outer gap ÷ 2)
            </text>
            <text x={padding + xP1 + P1 / 2} y={originY - top.P1 - 6} textAnchor="middle" fontSize="11">
              Top P1 = L/2 + allowance − (inner gap ÷ 2)
            </text>
          </>
        )}

        {/* Dimension lines */}
        {showDimLines && (
          <>
            {/* Overall blank width */}
            <DimLine
              x1={padding + xGlue}
              y1={padding + totalH}
              x2={padding + xEnd}
              y2={padding + totalH}
              label={bw}
              offset={12}
            />
            {/* Score-to-score height */}
            <DimLine
              x1={padding + xEnd + 18}
              y1={originY}
              x2={padding + xEnd + 18}
              y2={originY + bh}
              label={bh}
              offset={0}
            />
            {/* Panel widths */}
            <DimLine
              x1={padding + xP1}
              y1={padding + totalH - 30}
              x2={padding + xP2}
              y2={padding + totalH - 30}
              label={P1}
              offset={10}
            />
            <DimLine
              x1={padding + xP2}
              y1={padding + totalH - 30}
              x2={padding + xP3}
              y2={padding + totalH - 30}
              label={P2}
              offset={10}
            />
            <DimLine
              x1={padding + xP3}
              y1={padding + totalH - 30}
              x2={padding + xP4}
              y2={padding + totalH - 30}
              label={P3}
              offset={10}
            />
            <DimLine
              x1={padding + xP4}
              y1={padding + totalH - 30}
              x2={padding + xEnd}
              y2={padding + totalH - 30}
              label={P4}
              offset={10}
            />
          </>
        )}
      </svg>
    </div>
  );
}

function round(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
