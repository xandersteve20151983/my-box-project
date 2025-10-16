// app/components/BoxPreview2D.js
"use client";

import React, { useMemo, useRef, useLayoutEffect, useState } from "react";

/* ============================== Consts ============================== */
const DIM_COLOR = "#2e7d32";   // green – dimensions
const SCORE_COLOR = "#c62828"; // red – scores
const CUT_COLOR = "#000";      // black – cutting outline
const SCORE_W = 1;
const CUT_W = 1.5;

const FONT = 12;       // px
const LABEL_GAP = 60;  // px: distance of section labels from outline
const DIM_GAP = 40;    // px: distance of vertical dim plates from outline

/* Small UI helpers */
function DimText({ x, y, text, align = "middle" }) {
  const pad = 4;
  const approxW = Math.max(32, text.length * FONT * 0.6);
  const approxH = FONT * 1.25;
  const x0 = align === "start" ? x : align === "end" ? x - approxW : x - approxW / 2;

  return (
    <>
      <rect
        x={x0 - pad}
        y={y - approxH / 2 - pad}
        width={approxW + 2 * pad}
        height={approxH + 2 * pad}
        fill="white"
        opacity="0.9"
        rx="2"
        ry="2"
      />
      <text
        x={x}
        y={y}
        fontSize={FONT}
        dominantBaseline="middle"
        textAnchor={align}
        fill={DIM_COLOR}
      >
        {text}
      </text>
    </>
  );
}

function DimMarkers() {
  return (
    <defs>
      <marker id="dimArrowGreen" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6 Z" fill={DIM_COLOR} />
      </marker>
    </defs>
  );
}

/* ============================== Component ============================== */
export default function BoxPreview2D({ inputs, derived }) {
  // ---- read from parent state ----
  const {
    L, W, D,
    fluteThickness,
    p1, p2, p3, p4,
    flapAllowance,
    flapGapInner, flapGapOuter,
    glueLapWidth,
    glueLapExtensionA,
    glueLapBevelAngle,
    glueLapOff,        // "small" | "large" (only affects label order; geometry already derived)
    gluePosition,      // "inside" | "outside" (for spec line)
    slotWidth,
    showPanelLabels,
    showDimLines,
    showFlapLabels,    // (label text not drawn separately yet; kept for future use)
    fluteCode,
    styleCode,
  } = inputs;

  // ---- geometry derived in parent ----
  const panels = [derived.P1, derived.P2, derived.P3, derived.P4];     // mm
  const glueLap = derived.glueLap;                                     // mm
  const s2s = derived.scoreToScore;                                    // mm
  const topH = [derived.top.P1, derived.top.P2, derived.top.P3, derived.top.P4];     // mm
  const botH = [derived.bottom.P1, derived.bottom.P2, derived.bottom.P3, derived.bottom.P4]; // mm
  const dieWmm = glueLap + panels.reduce((a, b) => a + b, 0);          // mm
  const dieHmm = Math.max(...topH) + s2s + Math.max(...botH);          // mm

  /* ---------------- container sizing (fit to view) ---------------- */
  const wrapRef = useRef(null);
  const [wrapSize, setWrapSize] = useState({ w: 1200, h: 620 });

  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setWrapSize({ w: r.width, h: r.height });
    });
    obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  const PAD = 24; // px
  const viewW = Math.max(200, wrapSize.w - 2 * PAD);
  const viewH = Math.max(200, wrapSize.h - 2 * PAD);
  const sFit = Math.min(viewW / dieWmm, viewH / dieHmm); // px per mm
  const mm = (v) => v * sFit;

  /* ---------------- key construction lines ---------------- */
  const topMax = Math.max(...topH);
  const botMax = Math.max(...botH);

  const left = PAD + mm(glueLap);
  const right = PAD + mm(dieWmm);
  const top = PAD;
  const yTopScore = top + mm(topMax);
  const yBotScore = yTopScore + mm(s2s);
  const bottom = yTopScore + mm(s2s) + mm(botMax);

  // panel x’s
  const x1 = left + mm(panels[0]);
  const x2 = x1 + mm(panels[1]);
  const x3 = x2 + mm(panels[2]);

  // flap edges per panel
  const topEdge = [
    yTopScore - mm(topH[0]),
    yTopScore - mm(topH[1]),
    yTopScore - mm(topH[2]),
    yTopScore - mm(topH[3]),
  ];
  const botEdge = [
    yBotScore + mm(botH[0]),
    yBotScore + mm(botH[1]),
    yBotScore + mm(botH[2]),
    yBotScore + mm(botH[3]),
  ];

  /* ---------------- glue-lap chamfers / slots ---------------- */
  const swPx = Math.max(0.5, +slotWidth || 0) * sFit;
  const glueSlot = [left - swPx / 2, left + swPx / 2]; // centered on glue lap
  const hasGlueSlot = swPx > 0.25;

  // chamfer geometry
  const xChamferStart = hasGlueSlot ? glueSlot[0] : left;
  const bevelRad = Math.max(0.1, Math.min(Math.PI / 2, (+glueLapBevelAngle || 0) * Math.PI / 180));
  const runPx = Math.max(0, xChamferStart - PAD);
  const autoV = runPx * Math.tan(bevelRad);
  const extPx = mm(Math.max(0, +glueLapExtensionA || 0)); // explicit a in mm (vertical)
  const vChange = extPx > 0 ? extPx : autoV;

  const chamferTopY = Math.min(bottom, topEdge[0] + vChange);
  const chamferBotY = Math.max(top,    botEdge[0] - vChange);

  // section labels x position
  const labelX = left - LABEL_GAP;

  // small helper to draw measurement lines
  const dimLine = (x1, y1, x2, y2, key) => (
    <line
      key={key}
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={DIM_COLOR} strokeWidth={1.25}
      markerStart="url(#dimArrowGreen)" markerEnd="url(#dimArrowGreen)"
    />
  );

  /* ============================== RENDER ============================== */
  return (
    <div className="p-4 space-y-3">
      {/* spec line */}
      <div className="text-sm font-mono">
        {`FEFCO ${styleCode} — internal L=${L} W=${W} D=${D} | flute=${fluteCode} t=${fluteThickness} | glue=${glueLap} | glueSide=${gluePosition} | glueOff=${glueLapOff} | adds P1=${p1} P2=${p2} P3=${p3} P4=${p4} | a=${glueLapExtensionA} | angle=${glueLapBevelAngle}° | S2S=${s2s} mm | sheet=${dieWmm}×${dieHmm} mm`}
      </div>

      {/* viewport */}
      <div ref={wrapRef} className="border rounded-lg bg-white overflow-hidden" style={{ height: 620 }}>
        <svg width="100%" height="100%">
          <DimMarkers />

          {/* ===== Section labels ===== */}
          {showPanelLabels && (
            <>
              <text x={labelX} y={(top + yTopScore) / 2} fontSize={FONT} textAnchor="end">Top Flaps</text>
              <text x={labelX} y={(yTopScore + yBotScore) / 2} fontSize={FONT} textAnchor="end">Body</text>
              <text x={labelX} y={(yBotScore + bottom) / 2} fontSize={FONT} textAnchor="end">Bottom Flaps</text>
            </>
          )}

          {/* ===== Glue-lap chamfers and slot ===== */}
          {chamferBotY > chamferTopY && (
            <line x1={PAD} y1={chamferTopY} x2={PAD} y2={chamferBotY} stroke={CUT_COLOR} strokeWidth={CUT_W}/>
          )}
          <line x1={xChamferStart} y1={topEdge[0]} x2={PAD} y2={chamferTopY} stroke={CUT_COLOR} strokeWidth={CUT_W}/>
          <line x1={xChamferStart} y1={botEdge[0]} x2={PAD} y2={chamferBotY} stroke={CUT_COLOR} strokeWidth={CUT_W}/>

          {hasGlueSlot && (
            <>
              <line x1={glueSlot[0]} y1={yTopScore} x2={glueSlot[1]} y2={yTopScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W}/>
              <line x1={glueSlot[0]} y1={yBotScore} x2={glueSlot[1]} y2={yBotScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W}/>
            </>
          )}

          {/* ===== Global scores ===== */}
          <line x1={PAD} y1={yTopScore} x2={right} y2={yTopScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W}/>
          <line x1={PAD} y1={yBotScore} x2={right} y2={yBotScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W}/>

          {/* ===== Body vertical scores (including glue-lap left edge) ===== */}
          {[left, x1, x2, x3].map((xx, i) => (
            <line key={`bodyV-${i}`} x1={xx} y1={yTopScore} x2={xx} y2={yBotScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W}/>
          ))}

          {/* ===== Cutting boundary: TOP with slots ===== */}
          {(() => {
            const slotRanges = [
              ...(hasGlueSlot ? [glueSlot] : []),
              [x1 - swPx / 2, x1 + swPx / 2],
              [x2 - swPx / 2, x2 + swPx / 2],
              [x3 - swPx / 2, x3 + swPx / 2],
            ];
            const yAt = (x) => (x < x1 ? topEdge[0] : x < x2 ? topEdge[1] : x < x3 ? topEdge[2] : topEdge[3]);

            const path = [];
            const xs0 = hasGlueSlot ? glueSlot[0] : left;
            path.push({ x: xs0, y: yAt(xs0) });

            const advanceTo = (x) => path.push({ x, y: yAt(x) });
            slotRanges.forEach(([a, b]) => {
              advanceTo(a);
              path.push({ x: a, y: yTopScore });
              path.push({ x: b, y: yTopScore });
              path.push({ x: b, y: yAt(b) });
            });
            advanceTo(right);

            const d = path.reduce((acc, p, i) => acc + `${i ? "L" : "M"} ${p.x} ${p.y} `, "");
            return <path d={d} stroke={CUT_COLOR} strokeWidth={CUT_W} fill="none" />;
          })()}

          {/* ===== Cutting boundary: BOTTOM with slots ===== */}
          {(() => {
            const slotRanges = [
              ...(hasGlueSlot ? [glueSlot] : []),
              [x1 - swPx / 2, x1 + swPx / 2],
              [x2 - swPx / 2, x2 + swPx / 2],
              [x3 - swPx / 2, x3 + swPx / 2],
            ];
            const yAt = (x) => (x < x1 ? botEdge[0] : x < x2 ? botEdge[1] : x < x3 ? botEdge[2] : botEdge[3]);

            const path = [];
            const xs0 = hasGlueSlot ? glueSlot[0] : left;
            path.push({ x: xs0, y: yAt(xs0) });

            const advanceTo = (x) => path.push({ x, y: yAt(x) });
            slotRanges.forEach(([a, b]) => {
              advanceTo(a);
              path.push({ x: a, y: yBotScore });
              path.push({ x: b, y: yBotScore });
              path.push({ x: b, y: yAt(b) });
            });
            advanceTo(right);

            const d = path.reduce((acc, p, i) => acc + `${i ? "L" : "M"} ${p.x} ${p.y} `, "");
            return <path d={d} stroke={CUT_COLOR} strokeWidth={CUT_W} fill="none" />;
          })()}

          {/* right outer border */}
          <line x1={right} y1={topEdge[3]} x2={right} y2={botEdge[3]} stroke={CUT_COLOR} strokeWidth={CUT_W}/>

          {/* ===== Dimensions ===== */}
          {showDimLines && (
            <>
              {/* S2S */}
              <line
                x1={right + DIM_GAP / 2} y1={yTopScore}
                x2={right + DIM_GAP / 2} y2={yBotScore}
                stroke={DIM_COLOR} strokeWidth={1.25}
                markerStart="url(#dimArrowGreen)" markerEnd="url(#dimArrowGreen)"
              />
              <DimText x={right + DIM_GAP / 2} y={(yTopScore + yBotScore) / 2} text={`${s2s} mm`} />

              {/* panel widths */}
              {(() => {
                const y = bottom - 16;
                const t = bottom - 24;
                const xs = [left, x1, x2, x3, right];
                const widths = [panels[0], panels[1], panels[2], panels[3]];
                return xs.slice(0, 4).map((x, i) => (
                  <g key={`pw-${i}`}>
                    <line
                      x1={xs[i]} y1={y} x2={xs[i + 1]} y2={y}
                      stroke={DIM_COLOR} strokeWidth={1.25}
                      markerStart="url(#dimArrowGreen)" markerEnd="url(#dimArrowGreen)"
                    />
                    <DimText x={(xs[i] + xs[i + 1]) / 2} y={t} text={`${widths[i]} mm`} />
                  </g>
                ));
              })()}

              {/* sheet length at top */}
              <line
                x1={PAD + 0} y1={top + 8}
                x2={PAD + mm(dieWmm)} y2={top + 8}
                stroke={DIM_COLOR} strokeWidth={1.25}
                markerStart="url(#dimArrowGreen)" markerEnd="url(#dimArrowGreen)"
              />
              <DimText x={PAD + mm(dieWmm) / 2} y={top + 8} text={`${dieWmm} mm`} />

              {/* flap heights on P2/P3 (as anchors) */}
              {(() => {
                const midP2 = (x1 + x2) / 2;
                const midP3 = (x2 + x3) / 2;

                // top
                <line />;
                return (
                  <>
                    {/* top P2 */}
                    <line
                      x1={midP2} y1={topEdge[1]}
                      x2={midP2} y2={yTopScore}
                      stroke={DIM_COLOR} strokeWidth={1.25}
                      markerStart="url(#dimArrowGreen)" markerEnd="url(#dimArrowGreen)"
                    />
                    <DimText x={midP2} y={(topEdge[1] + yTopScore) / 2} text={`${topH[1]} mm`} />
                    {/* top P3 */}
                    <line
                      x1={midP3} y1={topEdge[2]}
                      x2={midP3} y2={yTopScore}
                      stroke={DIM_COLOR} strokeWidth={1.25}
                      markerStart="url(#dimArrowGreen)" markerEnd="url(#dimArrowGreen)"
                    />
                    <DimText x={midP3} y={(topEdge[2] + yTopScore) / 2} text={`${topH[2]} mm`} />

                    {/* bottom P2 */}
                    <line
                      x1={midP2} y1={yBotScore}
                      x2={midP2} y2={botEdge[1]}
                      stroke={DIM_COLOR} strokeWidth={1.25}
                      markerStart="url(#dimArrowGreen)" markerEnd="url(#dimArrowGreen)"
                    />
                    <DimText x={midP2} y={(yBotScore + botEdge[1]) / 2} text={`${botH[1]} mm`} />
                    {/* bottom P3 */}
                    <line
                      x1={midP3} y1={yBotScore}
                      x2={midP3} y2={botEdge[2]}
                      stroke={DIM_COLOR} strokeWidth={1.25}
                      markerStart="url(#dimArrowGreen)" markerEnd="url(#dimArrowGreen)"
                    />
                    <DimText x={midP3} y={(yBotScore + botEdge[2]) / 2} text={`${botH[2]} mm`} />
                  </>
                );
              })()}
            </>
          )}

          {/* panel titles */}
          {showPanelLabels && (
            <>
              <text x={(PAD + left) / 2} y={top + 38} fontSize={FONT} textAnchor="middle">Glue Lap</text>
              <text x={(left + x1) / 2} y={top + 38} fontSize={FONT} textAnchor="middle">Panel 1</text>
              <text x={(x1 + x2) / 2} y={top + 38} fontSize={FONT} textAnchor="middle">Panel 2</text>
              <text x={(x2 + x3) / 2} y={top + 38} fontSize={FONT} textAnchor="middle">Panel 3</text>
              <text x={(x3 + right) / 2} y={top + 38} fontSize={FONT} textAnchor="middle">Panel 4</text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
