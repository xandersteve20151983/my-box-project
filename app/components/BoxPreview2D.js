// app/components/BoxPreview2D.js
"use client";

import React, { useMemo, useRef, useLayoutEffect, useState } from "react";

/* =========================================================
   Visual constants
   ========================================================= */
const DIM_COLOR = "#2e7d32";   // green – dimensions
const SCORE_COLOR = "#c62828"; // red – scores
const CUT_COLOR = "#000";      // black – cutting outline
const SCORE_W = 1;
const CUT_W = 1.5;

const FONT = 12;
const LABEL_GAP = 60;
const DIM_GAP = 40;

/* =========================================================
   Helpers
   ========================================================= */
const r = (x) => Math.round(x);
const flr = (x) => Math.floor(x);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function DimMarkers() {
  return (
    <defs>
      <marker id="dimArrowGreen" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6 Z" fill={DIM_COLOR} />
      </marker>
    </defs>
  );
}

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

/* =========================================================
   Tiny allowance table from the “old working” version
   ========================================================= */
function getAllowances(glueSide /* "inside"|"outside" */, thickness) {
  // Keep this simple: use thickness to pick reasonable P adds + H1.
  // (You can wire this to Admin later.)
  const t = +thickness || 3;

  // heuristic: thicker flutes ⇒ bigger H1 and small panel adds
  const tier =
    t <= 2 ? { P1: 2, P2: 2, P3: 2, P4: 0, rscH1: 3, flap: 0 } :
    t <= 3.5 ? { P1: 5, P2: 3, P3: 3, P4: 0, rscH1: 6, flap: 0 } :
    t <= 4.5 ? { P1: 4, P2: 4, P3: 4, P4: 1, rscH1: 8, flap: 1 } :
               { P1: 5, P2: 5, P3: 5, P4: 2, rscH1: 10, flap: 1 };

  // outside vs inside can slightly differ; keep same here for simplicity
  return tier;
}

/* =========================================================
   Geometry model (0201)
   ========================================================= */
function computeRSC({ L, W, H, thickness, glueLap, adds, start = "W", h1 }) {
  const a = { P1: 0, P2: 0, P3: 0, P4: 0, ...(adds || {}) };
  const seq = start === "L" ? ["L", "W", "L", "W"] : ["W", "L", "W", "L"];

  const raw = [
    seq[0] === "W" ? W : L,
    seq[1] === "W" ? W : L,
    seq[2] === "W" ? W : L,
    seq[3] === "W" ? W : L,
  ];
  const addsArr = [a.P1, a.P2, a.P3, a.P4].map((x) => +x || 0);
  const panels = raw.map((base, i) => r(base + addsArr[i]));

  const s2s = r(H + h1);
  const refFlap = r(W / 2);
  const totalWidth = panels.reduce((A, B) => A + B, 0) + r(glueLap);
  const totalHeight = refFlap + s2s + refFlap;

  return {
    panels,
    s2s,
    refFlap,
    totalWidth,
    totalHeight,
    glueLap: r(glueLap),
  };
}

/* =========================================================
   Component
   ========================================================= */
+ export default function BoxPreview2D(props = {}) {
+   const {
+     L = 300,
+     W = 200,
+     H = 150,
+     thickness = 4,
+     glueSide = "inside",
+     glueOff = "small",
+     glueLap = 28,
+     glueExt = 14,
+     bevelDeg = 30,
+     slotWidth = 6,
+     showDims = true,
+     showLabels = true,
+   } = props;
  // container fit
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

  // allowances
  const addsRow = useMemo(() => getAllowances(glueSide, thickness), [glueSide, thickness]);
  const rscH1 = +addsRow?.rscH1 || 2 * (+thickness || 3);
  const flapAllowance = +addsRow?.flap || 0;

  // geometry
  const model = useMemo(
    () =>
      computeRSC({
        L: +L, W: +W, H: +H,
        thickness,
        glueLap: +glueLap,
        adds: {
          P1: +addsRow.P1 || 0,
          P2: +addsRow.P2 || 0,
          P3: +addsRow.P3 || 0,
          P4: +addsRow.P4 || 0,
        },
        start: glueOff === "large" ? "L" : "W",
        h1: rscH1,
      }),
    [L, W, H, thickness, glueLap, addsRow, glueOff, rscH1]
  );

  // fit-to-view
  const PAD = 24;
  const dieWmm = model.totalWidth;
  const dieHmm = model.totalHeight;

  const viewW = Math.max(200, wrapSize.w - 2 * PAD);
  const viewH = Math.max(200, wrapSize.h - 2 * PAD);
  const sFit = Math.min(viewW / dieWmm, viewH / dieHmm);
  const mm = (v) => v * sFit;

  // outline edges
  const left = PAD + mm(model.glueLap);
  const top = PAD;
  const right = PAD + mm(dieWmm);
  const bottom = PAD + mm(dieHmm);

  // panel boundaries
  const x1 = left + mm(model.panels[0]);
  const x2 = x1 + mm(model.panels[1]);
  const x3 = x2 + mm(model.panels[2]);

  // scores Y
  const yTopScore = top + mm(model.refFlap);
  const yBotScore = top + mm(model.refFlap + model.s2s);

  // top/bottom flap heights (same logic from the “good” version)
  const P2mm = model.panels[1];
  const P3mm = model.panels[2];

  // defaults: gapTopInner=4, gapTopOuter=4, gapBotInner=4, gapBotOuter=4
  const gTI = 4, gTO = 4, gBI = 4, gBO = 4;

  const topP2h = Math.max(0, flr((P3mm - 2 - gTO) / 2 + flapAllowance));
  const topP3h = Math.max(0, flr((P2mm - 2 - gTI) / 2 + flapAllowance));
  const botP2h = Math.max(0, flr((P3mm - 2 - gBO) / 2 + flapAllowance));
  const botP3h = Math.max(0, flr((P2mm - 2 - gBI) / 2 + flapAllowance));

  const topEdge = [
    yTopScore - mm(topP3h),
    yTopScore - mm(topP2h),
    yTopScore - mm(topP3h),
    yTopScore - mm(topP2h),
  ];

  const botEdge = [
    yBotScore + mm(botP3h),
    yBotScore + mm(botP2h),
    yBotScore + mm(botP3h),
    yBotScore + mm(botP2h),
  ];

  // slot & chamfer
  const swPx = Math.max(0.5, +slotWidth) * sFit;
  const glueHalf = Math.min(swPx / 2, Math.max(0, left - (PAD + 0.75)));
  const hasGlueSlot = glueHalf > 0;
  const glueSlot = hasGlueSlot ? [left - glueHalf, left + glueHalf] : null;

  const xChamferStart = glueSlot ? glueSlot[0] : left;
  const meetTopY = topEdge[0];
  const meetBotY = botEdge[0];

  const runPx = Math.max(0, xChamferStart - PAD);
  const angleRad = clamp((+bevelDeg || 0) * (Math.PI / 180), 0.1, Math.PI / 2);
  const autoV = runPx * Math.tan(angleRad);

  const extPx = mm(Math.max(0, +glueExt || 0));
  const vChange = extPx > 0 ? extPx : autoV;

  const chamferTopY = Math.min(bottom, meetTopY + vChange);
  const chamferBotY = Math.max(top, meetBotY - vChange);

  // helpers
  const dimLine = (x1, y1, x2, y2, key) => (
    <line
      key={key}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={DIM_COLOR}
      strokeWidth={1.25}
      markerStart="url(#dimArrowGreen)"
      markerEnd="url(#dimArrowGreen)"
    />
  );

  return (
    <div ref={wrapRef} className="border rounded-lg bg-white overflow-hidden" style={{ height: 620 }}>
      <svg width="100%" height="100%">
        <DimMarkers />

        {/* Labels (fixed distance left side) */}
        {showLabels && (
          <>
            <text x={left - LABEL_GAP} y={(top + yTopScore) / 2} fontSize={FONT} textAnchor="end">Top Flaps</text>
            <text x={left - LABEL_GAP} y={(yTopScore + yBotScore) / 2} fontSize={FONT} textAnchor="end">Body</text>
            <text x={left - LABEL_GAP} y={(yBotScore + bottom) / 2} fontSize={FONT} textAnchor="end">Bottom Flaps</text>
          </>
        )}

        {/* Glue-lap chamfers + slot */}
        {chamferBotY > chamferTopY && (
          <line x1={PAD} y1={chamferTopY} x2={PAD} y2={chamferBotY} stroke={CUT_COLOR} strokeWidth={CUT_W} />
        )}
        <line x1={xChamferStart} y1={meetTopY} x2={PAD} y2={chamferTopY} stroke={CUT_COLOR} strokeWidth={CUT_W} />
        <line x1={xChamferStart} y1={meetBotY} x2={PAD} y2={chamferBotY} stroke={CUT_COLOR} strokeWidth={CUT_W} />

        {hasGlueSlot && (
          <>
            <line x1={glueSlot[0]} y1={yTopScore} x2={glueSlot[1]} y2={yTopScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W} />
            <line x1={glueSlot[0]} y1={yBotScore} x2={glueSlot[1]} y2={yBotScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W} />
          </>
        )}

        {/* Global horizontal scores */}
        <line x1={PAD} y1={yTopScore} x2={right} y2={yTopScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W} />
        <line x1={PAD} y1={yBotScore} x2={right} y2={yBotScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W} />

        {/* Vertical score lines across body */}
        {[left, x1, x2, x3].map((xx, i) => (
          <line key={`bodyV-${i}`} x1={xx} y1={yTopScore} x2={xx} y2={yBotScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W} />
        ))}

        {/* TOP cutting boundary with slot interruptions */}
        {(() => {
          const slots = [];
          if (glueSlot) slots.push(glueSlot);
          [x1, x2, x3].forEach((xc) => slots.push([xc - swPx / 2, xc + swPx / 2]));

          const yAt = (x) => (x < x1 ? topEdge[0] : x < x2 ? topEdge[1] : x < x3 ? topEdge[2] : topEdge[3]);
          const path = [];
          const xs0 = glueSlot ? glueSlot[0] : left;
          path.push({ x: xs0, y: yAt(xs0) });
          const advanceTo = (x) => path.push({ x, y: yAt(x) });

          slots.forEach(([a, b]) => {
            advanceTo(a);
            path.push({ x: a, y: yTopScore });
            path.push({ x: b, y: yTopScore });
            path.push({ x: b, y: yAt(b) });
          });
          advanceTo(right);

          const d = path.reduce((acc, p, i) => acc + `${i ? "L" : "M"} ${p.x} ${p.y} `, "");
          return <path d={d} stroke={CUT_COLOR} strokeWidth={CUT_W} fill="none" />;
        })()}

        {/* BOTTOM cutting boundary with slot interruptions */}
        {(() => {
          const slots = [];
          if (glueSlot) slots.push(glueSlot);
          [x1, x2, x3].forEach((xc) => slots.push([xc - swPx / 2, xc + swPx / 2]));

          const yAt = (x) => (x < x1 ? botEdge[0] : x < x2 ? botEdge[1] : x < x3 ? botEdge[2] : botEdge[3]);
          const path = [];
          const xs0 = glueSlot ? glueSlot[0] : left;
          path.push({ x: xs0, y: yAt(xs0) });
          const advanceTo = (x) => path.push({ x, y: yAt(x) });

          slots.forEach(([a, b]) => {
            advanceTo(a);
            path.push({ x: a, y: yBotScore });
            path.push({ x: b, y: yBotScore });
            path.push({ x: b, y: yAt(b) });
          });
          advanceTo(right);

          const d = path.reduce((acc, p, i) => acc + `${i ? "L" : "M"} ${p.x} ${p.y} `, "");
          return <path d={d} stroke={CUT_COLOR} strokeWidth={CUT_W} fill="none" />;
        })()}

        {/* Right outer vertical boundary */}
        <line x1={right} y1={topEdge[3]} x2={right} y2={botEdge[3]} stroke={CUT_COLOR} strokeWidth={CUT_W} />

        {/* Dimension lines & labels */}
        {showDims && (
          <>
            {/* Top flap heights */}
            {dimLine((x1 + x2) / 2, topEdge[1], (x1 + x2) / 2, yTopScore, "tp2")}
            <DimText x={(x1 + x2) / 2} y={(topEdge[1] + yTopScore) / 2} text={`${topP2h} mm`} />

            {dimLine((x2 + x3) / 2, topEdge[2], (x2 + x3) / 2, yTopScore, "tp3")}
            <DimText x={(x2 + x3) / 2} y={(topEdge[2] + yTopScore) / 2} text={`${topP3h} mm`} />

            {/* Bottom flap heights */}
            {dimLine((x1 + x2) / 2, yBotScore, (x1 + x2) / 2, botEdge[1], "bp2")}
            <DimText x={(x1 + x2) / 2} y={(yBotScore + botEdge[1]) / 2} text={`${botP2h} mm`} />

            {dimLine((x2 + x3) / 2, yBotScore, (x2 + x3) / 2, botEdge[2], "bp3")}
            <DimText x={(x2 + x3) / 2} y={(yBotScore + botEdge[2]) / 2} text={`${botP3h} mm`} />

            {/* S2S on the right */}
            {dimLine(right + DIM_GAP / 2, yTopScore, right + DIM_GAP / 2, yBotScore, "s2s")}
            <DimText x={right + DIM_GAP / 2} y={(yTopScore + yBotScore) / 2} text={`${model.s2s} mm`} />

            {/* Panel widths along bottom */}
            {dimLine(left, bottom - 16, x1, bottom - 16, "p1w")}
            <DimText x={(left + x1) / 2} y={bottom - 24} text={`${model.panels[0]} mm`} />

            {dimLine(x1, bottom - 16, x2, bottom - 16, "p2w")}
            <DimText x={(x1 + x2) / 2} y={bottom - 24} text={`${model.panels[1]} mm`} />

            {dimLine(x2, bottom - 16, x3, bottom - 16, "p3w")}
            <DimText x={(x2 + x3) / 2} y={bottom - 24} text={`${model.panels[2]} mm`} />

            {dimLine(x3, bottom - 16, right, bottom - 16, "p4w")}
            <DimText x={(x3 + right) / 2} y={bottom - 24} text={`${model.panels[3]} mm`} />

            {/* Sheet length across top */}
            {dimLine(left, top + 8, right, top + 8, "sheet")}
            <DimText x={(left + right) / 2} y={top + 8} text={`${dieWmm} mm`} />
          </>
        )}

        {/* Panel titles */}
        {showLabels && (
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
  );
}
