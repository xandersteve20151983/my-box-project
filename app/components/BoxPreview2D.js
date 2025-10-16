"use client";

import React, { useMemo, useRef, useLayoutEffect, useState } from "react";

/* =========================================================
   Constants
   ========================================================= */
const DIM_COLOR = "#2e7d32";   // green – dimensions
const SCORE_COLOR = "#c62828"; // red – scores
const CUT_COLOR = "#000";      // black – cutting outline
const SCORE_W = 1;
const CUT_W = 1.5;

const FONT = 12;      // px label font
const LABEL_GAP = 60; // px distance of “Top/Body/Bottom” labels
const DIM_GAP = 40;   // px distance of vertical dimension plates

// flute → thickness (mm)
const FLUTE_THICKNESS = {
  E: 2, R: 2.5, B: 3, C: 4, A: 5, BE: 5, BR: 5.5, BC: 7, AC: 9,
};

// quick allowances table stub (kept simple and stable)
function getAllowances(glueSide, flute) {
  const f = (flute || "B").toUpperCase();
  const base = {
    inside: {
      E: { P1: 2, P2: 2, P3: 2, P4: 0, rscH1: 3, flap: 0 },
      R: { P1: 2, P2: 2, P3: 2, P4: 0, rscH1: 5, flap: 0 },
      B: { P1: 5, P2: 3, P3: 3, P4: 0, rscH1: 6, flap: 0 },
      C: { P1: 4, P2: 4, P3: 4, P4: 1, rscH1: 8, flap: 1 },
      A: { P1: 5, P2: 5, P3: 5, P4: 2, rscH1: 10, flap: 1 },
    },
    outside: {
      E: { P1: 2, P2: 2, P3: 2, P4: 0, rscH1: 3, flap: 0 },
      R: { P1: 2, P2: 2, P3: 2, P4: 0, rscH1: 5, flap: 0 },
      B: { P1: 5, P2: 3, P3: 3, P4: 0, rscH1: 6, flap: 0 },
      C: { P1: 4, P2: 4, P3: 4, P4: 1, rscH1: 8, flap: 1 },
      A: { P1: 5, P2: 5, P3: 5, P4: 2, rscH1: 10, flap: 1 },
    },
  };
  const side = glueSide === "inside" ? "inside" : "outside";
  return base[side][f] || base[side]["B"];
}

/* =========================================================
   Helpers
   ========================================================= */
const r = (x) => Math.round(x);
const flr = (x) => Math.floor(x);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

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

/* =========================================================
   Geometry (FEFCO 0201 family)
   ========================================================= */
function computeRSC({ L, W, H, glueLap, adds, start = "W", h1 }) {
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

  const s2s = r(H + h1);  // S2S height = H + H1
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
    seq,
    addsArr,
  };
}

/* =========================================================
   Component
   ========================================================= */
export default function BoxPreview2D(props = {}) {
  // Props (with safe defaults)
  const {
    // Internals (mm)
    L = 300,
    W = 200,
    H = 150,

    // Material
    flute = "B",
    thickness: thicknessInput, // optional override
    // Glue geometry
    glueSide = "inside",                // "inside" | "outside"
    glueOff = "small",                  // "small" (W) | "large" (L)
    glueLap = 28,                       // glue-lap width (mm)
    glueExt = 14,                       // extension a (mm) – 0 = auto by bevel
    bevelDeg = 30,                      // bevel from horizontal (deg)
    slotWidth = 6,                      // slot width (mm)

    // Optional gaps (mm) – default to 0 if not supplied
    gapTopInner = 0,
    gapTopOuter = 0,
    gapBotInner = 0,
    gapBotOuter = 0,

    // Toggles
    showDims = true,
    showLabels = true,
  } = props;

  // container size for fit-to-view
  const wrapRef = useRef(null);
  const [wrapSize, setWrapSize] = useState({ w: 1100, h: 560 });
  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r) setWrapSize({ w: r.width, h: r.height });
    });
    obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  // material / allowances
  const thickness = thicknessInput ?? FLUTE_THICKNESS[(flute || "B").toUpperCase()] ?? 3;
  const addsRow = getAllowances(glueSide, flute);
  const rscH1 = +addsRow?.rscH1 || 2 * thickness;
  const flapAllowance = +addsRow?.flap || 0;

  // compute base model
  const model = useMemo(
    () =>
      computeRSC({
        L: +L,
        W: +W,
        H: +H,
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
    [L, W, H, glueLap, addsRow, glueOff, rscH1]
  );

  // Fit-to-view scale
  const PAD = 24; // px
  const dieWmm = model.totalWidth;
  const dieHmm = model.totalHeight;
  const viewW = Math.max(200, wrapSize.w - 2 * PAD);
  const viewH = Math.max(200, wrapSize.h - 2 * PAD);
  const sFit = Math.min(viewW / dieWmm, viewH / dieHmm);
  const mm = (v) => v * sFit;

  // key edges
  const left = PAD + mm(model.glueLap);
  const top = PAD;
  const right = PAD + mm(dieWmm);
  const bottom = PAD + mm(dieHmm);

  // panel boundaries (px)
  const x1 = left + mm(model.panels[0]);
  const x2 = x1 + mm(model.panels[1]);
  const x3 = x2 + mm(model.panels[2]);

  // horizontal scores
  const yTopScore = top + mm(model.refFlap);
  const yBotScore = top + mm(model.refFlap + model.s2s);

  // labels plate positions
  const labelX = left - LABEL_GAP;

  // little helper
  const dimLine = (x1p, y1p, x2p, y2p, key) => (
    <line
      key={key}
      x1={x1p}
      y1={y1p}
      x2={x2p}
      y2={y2p}
      stroke={DIM_COLOR}
      strokeWidth={1.25}
      markerStart="url(#dimArrowGreen)"
      markerEnd="url(#dimArrowGreen)"
    />
  );

  // flap heights using the requested formulas
  const P2mm = model.panels[1];
  const P3mm = model.panels[2];

  const topP2h = Math.max(0, flr((P3mm - 2 - (+gapTopOuter || 0)) / 2 + flapAllowance));
  const topP3h = Math.max(0, flr((P2mm - 2 - (+gapTopInner || 0)) / 2 + flapAllowance));
  const botP2h = Math.max(0, flr((P3mm - 2 - (+gapBotOuter || 0)) / 2 + flapAllowance));
  const botP3h = Math.max(0, flr((P2mm - 2 - (+gapBotInner || 0)) / 2 + flapAllowance));

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

  // glue-lap slot & chamfers
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

  // sheet length label
  const sheetLenMidX = (left + right) / 2;

  return (
    <div ref={wrapRef} className="border rounded-lg bg-white overflow-hidden" style={{ height: 560 }}>
      <svg width="100%" height="100%">
        <DimMarkers />

        {/* Section labels */}
        {showLabels && (
          <>
            <text x={labelX} y={(top + yTopScore) / 2} fontSize={FONT} textAnchor="end">
              Top Flaps
            </text>
            <text x={labelX} y={(yTopScore + yBotScore) / 2} fontSize={FONT} textAnchor="end">
              Body
            </text>
            <text x={labelX} y={(yBotScore + bottom) / 2} fontSize={FONT} textAnchor="end">
              Bottom Flaps
            </text>
          </>
        )}

        {/* Glue-lap chamfers + short vertical */}
        {chamferBotY > chamferTopY && (
          <line x1={PAD} y1={chamferTopY} x2={PAD} y2={chamferBotY} stroke={CUT_COLOR} strokeWidth={CUT_W} />
        )}
        <line x1={xChamferStart} y1={meetTopY} x2={PAD} y2={chamferTopY} stroke={CUT_COLOR} strokeWidth={CUT_W} />
        <line x1={xChamferStart} y1={meetBotY} x2={PAD} y2={chamferBotY} stroke={CUT_COLOR} strokeWidth={CUT_W} />

        {/* Glue slot at score lines */}
        {hasGlueSlot && (
          <>
            <line x1={glueSlot[0]} y1={yTopScore} x2={glueSlot[1]} y2={yTopScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W} />
            <line x1={glueSlot[0]} y1={yBotScore} x2={glueSlot[1]} y2={yBotScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W} />
          </>
        )}

        {/* Horizontal scores */}
        <line x1={PAD} y1={yTopScore} x2={right} y2={yTopScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W} />
        <line x1={PAD} y1={yBotScore} x2={right} y2={yBotScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W} />

        {/* Vertical scores inside body */}
        {[left, x1, x2, x3].map((xx, i) => (
          <line key={`bodyV-${i}`} x1={xx} y1={yTopScore} x2={xx} y2={yBotScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W} />
        ))}

        {/* Cutting boundary TOP (with slot interruptions) */}
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

        {/* Cutting boundary BOTTOM (with slot interruptions) */}
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

        {/* Right outer border between top/bottom */}
        <line x1={right} y1={topEdge[3]} x2={right} y2={botEdge[3]} stroke={CUT_COLOR} strokeWidth={CUT_W} />

        {/* Top flap heights (centres of P2, P3) */}
        {showDims && (
          <>
            {dimLine((x1 + x2) / 2, topEdge[1], (x1 + x2) / 2, yTopScore, "tp2")}
            <DimText x={(x1 + x2) / 2} y={(topEdge[1] + yTopScore) / 2} text={`${topP2h} mm`} />
            {dimLine((x2 + x3) / 2, topEdge[2], (x2 + x3) / 2, yTopScore, "tp3")}
            <DimText x={(x2 + x3) / 2} y={(topEdge[2] + yTopScore) / 2} text={`${topP3h} mm`} />
          </>
        )}

        {/* Bottom flap heights (centres of P2, P3) */}
        {showDims && (
          <>
            {dimLine((x1 + x2) / 2, yBotScore, (x1 + x2) / 2, botEdge[1], "bp2")}
            <DimText x={(x1 + x2) / 2} y={(yBotScore + botEdge[1]) / 2} text={`${botP2h} mm`} />
            {dimLine((x2 + x3) / 2, yBotScore, (x2 + x3) / 2, botEdge[2], "bp3")}
            <DimText x={(x2 + x3) / 2} y={(yBotScore + botEdge[2]) / 2} text={`${botP3h} mm`} />
          </>
        )}

        {/* S2S on the far right */}
        {showDims && (
          <>
            {dimLine(right + DIM_GAP / 2, yTopScore, right + DIM_GAP / 2, yBotScore, "s2s")}
            <DimText x={right + DIM_GAP / 2} y={(yTopScore + yBotScore) / 2} text={`${model.s2s} mm`} />
          </>
        )}

        {/* Panel widths along bottom */}
        {showDims && (
          <>
            {dimLine(left, bottom - 16, x1, bottom - 16, "p1w")}
            <DimText x={(left + x1) / 2} y={bottom - 24} text={`${model.panels[0]} mm`} />

            {dimLine(x1, bottom - 16, x2, bottom - 16, "p2w")}
            <DimText x={(x1 + x2) / 2} y={bottom - 24} text={`${model.panels[1]} mm`} />

            {dimLine(x2, bottom - 16, x3, bottom - 16, "p3w")}
            <DimText x={(x2 + x3) / 2} y={bottom - 24} text={`${model.panels[2]} mm`} />

            {dimLine(x3, bottom - 16, right, bottom - 16, "p4w")}
            <DimText x={(x3 + right) / 2} y={bottom - 24} text={`${model.panels[3]} mm`} />
          </>
        )}

        {/* Sheet length (top) */}
        {showDims && (
          <>
            {dimLine(left, top + 8, right, top + 8, "sheet")}
            <DimText x={sheetLenMidX} y={top + 8} text={`${dieWmm} mm`} />
          </>
        )}

        {/* Panel titles */}
        {showLabels && (
          <>
            <text x={(PAD + left) / 2} y={top + 38} fontSize={FONT} textAnchor="middle">
              Glue Lap
            </text>
            <text x={(left + x1) / 2} y={top + 38} fontSize={FONT} textAnchor="middle">
              Panel 1
            </text>
            <text x={(x1 + x2) / 2} y={top + 38} fontSize={FONT} textAnchor="middle">
              Panel 2
            </text>
            <text x={(x2 + x3) / 2} y={top + 38} fontSize={FONT} textAnchor="middle">
              Panel 3
            </text>
            <text x={(x3 + right) / 2} y={top + 38} fontSize={FONT} textAnchor="middle">
              Panel 4
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
