// app/components/BoxPreview2D.js
"use client";

import { useMemo } from "react";

export default function BoxPreview2D({ inputs, derived }) {
  const {
    slotWidth,
    showPanelLabels,
    showDimLines,
    showFlapLabels,
    glueLapBevelAngle,
    glueLapExtensionA,
    glueLapWidth,
    gluePosition,   // "inside" | "outside" (visual only)
  } = inputs;

  const {
    P1, P2, P3, P4,
    glueLap,               // equals glueLapWidth (no +a)
    blankWidth: bw,
    scoreToScore: bh,
    top, bottom,
  } = derived;

  // ---- layout ----
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
  const originY = padding + maxTop;

  // ---- helpers ----
  // flapPath: draws any flap. For glue-lap we apply bevel on free edge and extend vertically by "a".
  const flapPath = (x0, width, height, isTop, isGlueLapCol) => {
    const yBase = isTop ? originY : originY + bh;
    const dir = isTop ? -1 : +1;
    const a = isGlueLapCol ? Math.max(0, glueLapExtensionA) : 0;
    const tipY = yBase + dir * (height + a);

    // Bevel on glue-lap free edge. For "outside glue", flip bevel direction (visual).
    const bevelSign = (gluePosition === "outside") ? -1 : +1;
    const bevelX = isGlueLapCol
      ? bevelSign * Math.tan((glueLapBevelAngle * Math.PI) / 180) * Math.min(height + a, glueLapWidth)
      : 0;

    const x1 = x0;
    const x2 = x0 + width;
    const xFree = isGlueLapCol ? x2 + bevelX : x2;

    return `M ${x1},${yBase} L ${x2},${yBase} L ${xFree},${tipY} L ${x1},${tipY} Z`;
  };

  const DimLine = ({ x1, y1, x2, y2, label, offset = 10 }) => {
    const midx = (x1 + x2) / 2;
    return (
      <>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2e7d32" strokeDasharray="4 4" />
        <line x1={x1} y1={y1} x2={x1} y2={y1 + offset} stroke="#2e7d32" />
        <line x1={x2} y1={y2} x2={x2} y2={y2 + offset} stroke="#2e7d32" />
        <text x={midx} y={y1 + 16} fontSize="12" textAnchor="middle" fill="#1b5e20">
          {mm(label)}
        </text>
      </>
    );
  };

  // Slot notches as rectangles centred on each score; width = slotWidth (X), depth = 12 mm (Y)
  const SlotNotches = () => {
    if (!(slotWidth > 0)) return null;
    const d = 12;
    const w = slotWidth;
    const half = w / 2;

    return (
      <>
        {vScores.map((x, i) => {
          const sx = padding + x;
          return (
            <g key={`notch-${i}`}>
              <rect x={sx - half} y={originY - d} width={w} height={d} fill="#fff" stroke="#444" />
              <rect x={sx - half} y={originY + bh} width={w} height={d} fill="#fff" stroke="#444" />
            </g>
          );
        })}
      </>
    );
  };

  // ---- render ----
  return (
    <div className="w-full overflow-auto border rounded-xl p-2 bg-white">
      <svg viewBox={viewBox} className="w-full h-[520px]" role="img" aria-label="2D RSC Blank">
        {/* background */}
        <rect x="0" y="0" width={bw + padding * 2} height={totalH + padding * 2} fill="#fafafa" />

        {/* MAIN blank */}
        <rect x={padding + xGlue} y={originY} width={bw} height={bh} fill="#fff" stroke="#333" />

        {/* RED crease lines */}
        <line x1={padding + xGlue} y1={originY} x2={padding + xEnd} y2={originY} stroke="#cc3333" />
        <line x1={padding + xGlue} y1={originY + bh} x2={padding + xEnd} y2={originY + bh} stroke="#cc3333" />

        {/* TOP flaps */}
        <path d={flapPath(padding + xGlue, glueLap, top.P1, true,  true)}  fill="#fff" stroke="#999" />
        <path d={flapPath(padding + xP1,  P1,     top.P1, true,  false)} fill="#fff" stroke="#999" />
        <path d={flapPath(padding + xP2,  P2,     top.P2, true,  false)} fill="#fff" stroke="#999" />
        <path d={flapPath(padding + xP3,  P3,     top.P3, true,  false)} fill="#fff" stroke="#999" />
        <path d={flapPath(padding + xP4,  P4,     top.P4, true,  false)} fill="#fff" stroke="#999" />

        {/* BOTTOM flaps */}
        <path d={flapPath(padding + xGlue, glueLap, bottom.P1, false, true)}  fill="#fff" stroke="#999" />
        <path d={flapPath(padding + xP1,  P1,     bottom.P1, false, false)} fill="#fff" stroke="#999" />
        <path d={flapPath(padding + xP2,  P2,     bottom.P2, false, false)} fill="#fff" stroke="#999" />
        <path d={flapPath(padding + xP3,  P3,     bottom.P3, false, false)} fill="#fff" stroke="#999" />
        <path d={flapPath(padding + xP4,  P4,     bottom.P4, false, false)} fill="#fff" stroke="#999" />

        {/* vertical scores */}
        {vScores.map((x, i) => (
          <line
            key={`score-${i}`}
            x1={padding + x}
            y1={originY}
            x2={padding + x}
            y2={originY + bh}
            stroke="#777"
            strokeDasharray="6 6"
          />
        ))}

        {/* SLOT NOTCHES on top */}
        <SlotNotches />

        {/* Labels */}
        {showPanelLabels && (
          <>
            <text x={padding + xP1 + P1 / 2} y={originY + bh / 2} textAnchor="middle" fontSize="13">P1 (L)</text>
            <text x={padding + xP2 + P2 / 2} y={originY + bh / 2} textAnchor="middle" fontSize="13">P2 (W)</text>
            <text x={padding + xP3 + P3 / 2} y={originY + bh / 2} textAnchor="middle" fontSize="13">P3 (L)</text>
            <text x={padding + xP4 + P4 / 2} y={originY + bh / 2} textAnchor="middle" fontSize="13">P4 (W)</text>
            <text x={padding + glueLap / 2} y={originY + bh / 2} textAnchor="middle" fontSize="13">Glue-lap</text>
          </>
        )}

        {/* Flap labels (sample) */}
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

        {/* Green dimension lines */}
        {showDimLines && (
          <>
            <DimLine x1={padding + xGlue} y1={padding + totalH} x2={padding + xEnd} y2={padding + totalH} label={bw} offset={12} />
            <DimLine x1={padding + xEnd + 18} y1={originY} x2={padding + xEnd + 18} y2={originY + bh} label={bh} offset={0} />
            <DimLine x1={padding + xP1} y1={padding + totalH - 30} x2={padding + xP2} y2={padding + totalH - 30} label={P1} offset={10} />
            <DimLine x1={padding + xP2} y1={padding + totalH - 30} x2={padding + xP3} y2={padding + totalH - 30} label={P2} offset={10} />
            <DimLine x1={padding + xP3} y1={padding + totalH - 30} x2={padding + xP4} y2={padding + totalH - 30} label={P3} offset={10} />
            <DimLine x1={padding + xP4} y1={padding + totalH - 30} x2={padding + xEnd} y2={padding + totalH - 30} label={P4} offset={10} />
          </>
        )}
      </svg>
    </div>
  );
}

function mm(n) {
  return `${Math.round((n + Number.EPSILON) * 100) / 100} mm`;
}
