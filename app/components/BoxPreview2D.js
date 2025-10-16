"use client";

import React, { useMemo, useRef, useLayoutEffect, useState } from "react";

/* =========================================================
   Constants / simple lookups
   ========================================================= */
const DIM_COLOR = "#2e7d32"; // green – dimensions
const SCORE_COLOR = "#c62828"; // red – scores
const CUT_COLOR = "#000"; // black – cutting outline
const SCORE_W = 1;
const CUT_W = 1.5;

/** fixed (pixel) typography — these values never change visually */
const FONT = 12; // px for most labels
const FONT_SM = 10; // px for small notes
const LABEL_GAP = 60; // px: distance of "Top Flaps/Body/Bottom Flaps" from the outline
const DIM_GAP = 40; // px: distance of vertical dim plates from the outline

/** quick flute table (thickness mm) */
const FLUTE_THICKNESS = {
  E: 2,
  R: 2.5,
  B: 3,
  C: 4,
  A: 5,
  BE: 5,
  BR: 5.5,
  BC: 7,
  AC: 9,
};

/** very small allowance table (you can wire your data loader here) */
function getAllowances(glueSide, flute) {
  // Example allowances only — match your Admin table if needed.
  // P1..P4 = panel adds; rscH1 = the H1 add for S2S
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

/** small sticky dimension label background */
function DimText({ x, y, text, align = "middle" }) {
  const pad = 4;
  const approxW = Math.max(32, text.length * FONT * 0.6);
  const approxH = FONT * 1.25;

  const x0 =
    align === "start" ? x : align === "end" ? x - approxW : x - approxW / 2;

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

/** arrow marker defs for green dimension lines */
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
   Geometry model: FEFCO 0201
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
    seq,
    addsArr,
  };
}

/* =========================================================
   Main
   ========================================================= */
export default function BoxPreview2D() {
  /* ---------- inputs ---------- */
  const [L, setL] = useState(267);
  const [W, setW] = useState(120);
  const [H, setH] = useState(80);

  const [flute, setFlute] = useState("B");
  const [glueSide, setGlueSide] = useState("outside"); // "inside" | "outside"
  const [glueOff, setGlueOff] = useState("small"); // small(W) or large(L)

  const [glue, setGlue] = useState(28); // glue lap mm
  const [glueExt, setGlueExt] = useState(0); // a (mm)
  const [bevelDeg, setBevelDeg] = useState(24);

  const [slotWidth, setSlotWidth] = useState(9);

  // flap gaps (mm)
  const [gapTopInner, setGapTopInner] = useState(147);
  const [gapTopOuter, setGapTopOuter] = useState(0);
  const [gapBotInner, setGapBotInner] = useState(147);
  const [gapBotOuter, setGapBotOuter] = useState(0);

  // toggles
  const [showDims, setShowDims] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  /* ---------- container sizing (fit to view) ---------- */
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

  /* ---------- allowances ---------- */
  const thickness = FLUTE_THICKNESS[(flute || "B").toUpperCase()] || 3;
  const addsRow = getAllowances(glueSide, flute);
  const rscH1 = +addsRow?.rscH1 || 2 * thickness;
  const flapAllowance = +addsRow?.flap || 0;

  /* ---------- FEFCO 0201 geometry ---------- */
  const model = useMemo(
    () =>
      computeRSC({
        L: +L,
        W: +W,
        H: +H,
        thickness,
        glueLap: +glue,
        adds: {
          P1: +addsRow.P1 || 0,
          P2: +addsRow.P2 || 0,
          P3: +addsRow.P3 || 0,
          P4: +addsRow.P4 || 0,
        },
        start: glueOff === "large" ? "L" : "W",
        h1: rscH1,
      }),
    [L, W, H, thickness, glue, addsRow, glueOff, rscH1]
  );

  // mm totals
  const dieWmm = model.totalWidth;
  const dieHmm = model.totalHeight;

  // Fit-to-view scale (px per mm)
  const PAD = 24; // px
  const viewW = Math.max(200, wrapSize.w - 2 * PAD);
  const viewH = Math.max(200, wrapSize.h - 2 * PAD);
  const sFit = Math.min(viewW / dieWmm, viewH / dieHmm);

  // Convert mm → px by scale:
  const mm = (v) => v * sFit;

  // Outline edges (px)
  const left = PAD + mm(model.glueLap);
  const top = PAD;
  const right = PAD + mm(dieWmm);
  const bottom = PAD + mm(dieHmm);

  // Panel boundaries (px)
  const x1 = left + mm(model.panels[0]);
  const x2 = x1 + mm(model.panels[1]);
  const x3 = x2 + mm(model.panels[2]);

  // Score lines Y (px)
  const yTopScore = top + mm(model.refFlap);
  const yBotScore = top + mm(model.refFlap + model.s2s);

  // Section labels x (use fixed pixel offset away from outline)
  const labelX = left - LABEL_GAP;

  // small helpers to draw green dimension lines with markers
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

  /* ---------- flap tops/bottoms from gaps ---------- */
  const P2mm = model.panels[1];
  const P3mm = model.panels[2];

  // 1. top on P2 is (P3 - 2 - gapTopOuter)/2 + flapAllowance
  // 2. top on P3 is (P2 - 2 - gapTopInner)/2 + flapAllowance
  // 3. bottom on P2 is (P3 - 2 - gapBotOuter)/2 + flapAllowance
  // 4. bottom on P3 is (P2 - 2 - gapBotInner)/2 + flapAllowance
  const topP2h = Math.max(0, flr((P3mm - 2 - (+gapTopOuter || 0)) / 2 + flapAllowance));
  const topP3h = Math.max(0, flr((P2mm - 2 - (+gapTopInner || 0)) / 2 + flapAllowance));
  const botP2h = Math.max(0, flr((P3mm - 2 - (+gapBotOuter || 0)) / 2 + flapAllowance));
  const botP3h = Math.max(0, flr((P2mm - 2 - (+gapBotInner || 0)) / 2 + flapAllowance));

  // flap edges Y (px)
  const topEdge = [
    yTopScore - mm(topP3h), // P1 mirror of P3
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

  /* ---------- glue-lap chamfers / slot ---------- */
  const swPx = Math.max(0.5, +slotWidth) * sFit;
  const glueHalf = Math.min(swPx / 2, Math.max(0, left - (PAD + 0.75)));
  const hasGlueSlot = glueHalf > 0;
  const glueSlot = hasGlueSlot ? [left - glueHalf, left + glueHalf] : null;

  const xChamferStart = glueSlot ? glueSlot[0] : left;
  const meetTopY = topEdge[0];
  const meetBotY = botEdge[0];

  // vertical change for chamfers
  const runPx = Math.max(0, xChamferStart - PAD);
  const angleRad = clamp((+bevelDeg || 0) * (Math.PI / 180), 0.1, Math.PI / 2);
  const autoV = runPx * Math.tan(angleRad);
  // extension in mm is measured vertically — convert to px
  const extPx = mm(Math.max(0, +glueExt || 0));
  const vChange = extPx > 0 ? extPx : autoV;

  const chamferTopY = Math.min(bottom, meetTopY + vChange);
  const chamferBotY = Math.max(top, meetBotY - vChange);

  /* ---------- sheet length label (top) ---------- */
  const sheetLenPxLeft = left;
  const sheetLenPxRight = right;
  const sheetLenMidX = (sheetLenPxLeft + sheetLenPxRight) / 2;

  /* =========================================================
     Render
     ========================================================= */
  return (
    <div className="p-6 space-y-4">
      {/* Controls */}
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 text-sm items-end">
        <label className="flex flex-col">
          <span>Internal Length (L, mm)</span>
          <input type="number" value={L} onChange={(e) => setL(+e.target.value)} className="border rounded p-1"/>
        </label>
        <label className="flex flex-col">
          <span>Internal Width (W, mm)</span>
          <input type="number" value={W} onChange={(e) => setW(+e.target.value)} className="border rounded p-1"/>
        </label>
        <label className="flex flex-col">
          <span>Internal Height (H, mm)</span>
          <input type="number" value={H} onChange={(e) => setH(+e.target.value)} className="border rounded p-1"/>
        </label>

        <label className="flex flex-col">
          <span>Flute</span>
          <select value={flute} onChange={(e) => setFlute(e.target.value)} className="border rounded p-1">
            {Object.keys(FLUTE_THICKNESS).map((f) => (
              <option key={f} value={f}>
                {f} ({FLUTE_THICKNESS[f]} mm)
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col">
          <span>Glue position</span>
          <select value={glueSide} onChange={(e) => setGlueSide(e.target.value)} className="border rounded p-1">
            <option value="inside">Inside glue</option>
            <option value="outside">Outside glue</option>
          </select>
        </label>

        <label className="flex flex-col">
          <span>Glue lap off</span>
          <select value={glueOff} onChange={(e) => setGlueOff(e.target.value)} className="border rounded p-1">
            <option value="small">Small panel (W)</option>
            <option value="large">Large panel (L)</option>
          </select>
        </label>

        <label className="flex flex-col">
          <span>Glue lap (mm)</span>
          <input type="number" value={glue} onChange={(e) => setGlue(+e.target.value)} className="border rounded p-1"/>
        </label>

        <label className="flex flex-col">
          <span>Glue lap extension a (mm)</span>
          <input type="number" step="0.5" value={glueExt} onChange={(e) => setGlueExt(+e.target.value)} className="border rounded p-1"/>
        </label>

        <label className="flex flex-col">
          <span>Bevel angle (° from horizontal)</span>
          <input type="number" step="0.5" value={bevelDeg} onChange={(e) => setBevelDeg(+e.target.value)} className="border rounded p-1"/>
        </label>

        <label className="flex flex-col">
          <span>Slot width (mm)</span>
          <input type="number" step="0.5" value={slotWidth} onChange={(e) => setSlotWidth(+e.target.value)} className="border rounded p-1"/>
        </label>

        <label className="flex flex-col">
          <span>Flap gap (Top Inner)</span>
          <input type="number" step="0.5" value={gapTopInner} onChange={(e) => setGapTopInner(+e.target.value)} className="border rounded p-1"/>
        </label>
        <label className="flex flex-col">
          <span>Flap gap (Top Outer)</span>
          <input type="number" step="0.5" value={gapTopOuter} onChange={(e) => setGapTopOuter(+e.target.value)} className="border rounded p-1"/>
        </label>
        <label className="flex flex-col">
          <span>Flap gap (Bottom Inner)</span>
          <input type="number" step="0.5" value={gapBotInner} onChange={(e) => setGapBotInner(+e.target.value)} className="border rounded p-1"/>
        </label>
        <label className="flex flex-col">
          <span>Flap gap (Bottom Outer)</span>
          <input type="number" step="0.5" value={gapBotOuter} onChange={(e) => setGapBotOuter(+e.target.value)} className="border rounded p-1"/>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showDims} onChange={(e) => setShowDims(e.target.checked)}/>
          <span>Show dimensions</span>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)}/>
          <span>Show labels</span>
        </label>
      </div>

      {/* Spec line */}
      <div className="text-sm font-mono">
        {`FEFCO 0201 — internal L=${L} W=${W} H=${H} | flute=${flute} t=${thickness} | glue=${model.glueLap} | glueSide=${glueSide} | glueOff=${glueOff} | adds P1=${addsRow.P1} P2=${addsRow.P2} P3=${addsRow.P3} P4=${addsRow.P4} | a=${glueExt} | angle=${bevelDeg}° | S2S = H + H1 → ${model.s2s} mm | sheet=${model.totalWidth}×${model.totalHeight} mm`}
      </div>

      {/* Drawing viewport (fit to container) */}
      <div ref={wrapRef} className="border rounded-lg bg-white overflow-hidden" style={{ height: 620 }}>
        <svg width="100%" height="100%">
          <DimMarkers />

          {/* ===== Section labels ===== */}
          {showLabels && (
            <>
              <text x={labelX} y={(top + yTopScore) / 2} fontSize={FONT} textAnchor="end">Top Flaps</text>
              <text x={labelX} y={(yTopScore + yBotScore) / 2} fontSize={FONT} textAnchor="end">Body</text>
              <text x={labelX} y={(yBotScore + bottom) / 2} fontSize={FONT} textAnchor="end">Bottom Flaps</text>
            </>
          )}

          {/* ===== Glue-lap slot and chamfers ===== */}
          {chamferBotY > chamferTopY && (
            <line x1={PAD} y1={chamferTopY} x2={PAD} y2={chamferBotY} stroke={CUT_COLOR} strokeWidth={CUT_W}/>
          )}
          <line x1={xChamferStart} y1={meetTopY} x2={PAD} y2={chamferTopY} stroke={CUT_COLOR} strokeWidth={CUT_W}/>
          <line x1={xChamferStart} y1={meetBotY} x2={PAD} y2={chamferBotY} stroke={CUT_COLOR} strokeWidth={CUT_W}/>

          {hasGlueSlot && (
            <>
              <line x1={glueSlot[0]} y1={yTopScore} x2={glueSlot[1]} y2={yTopScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W}/>
              <line x1={glueSlot[0]} y1={yBotScore} x2={glueSlot[1]} y2={yBotScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W}/>
            </>
          )}

          {/* ===== Global scores ===== */}
          <line x1={PAD} y1={yTopScore} x2={right} y2={yTopScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W}/>
          <line x1={PAD} y1={yBotScore} x2={right} y2={yBotScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W}/>

          {/* ===== Body verticals (scores) ===== */}
          {[left, x1, x2, x3].map((xx, i) => (
            <line key={`bodyV-${i}`} x1={xx} y1={yTopScore} x2={xx} y2={yBotScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W}/>
          ))}

          {/* ===== Cutting boundary: TOP flaps (with slot interruptions) ===== */}
          {(() => {
            const slots = [];
            if (glueSlot) slots.push(glueSlot);
            [x1, x2, x3].forEach((xc) => slots.push([xc - swPx / 2, xc + swPx / 2]));
            const yAt = (x) => (x < x1 ? topEdge[0] : x < x2 ? topEdge[1] : x < x3 ? topEdge[2] : topEdge[3]);

            let path = [];
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

          {/* ===== Cutting boundary: BOTTOM flaps ===== */}
          {(() => {
            const slots = [];
            if (glueSlot) slots.push(glueSlot);
            [x1, x2, x3].forEach((xc) => slots.push([xc - swPx / 2, xc + swPx / 2]));
            const yAt = (x) => (x < x1 ? botEdge[0] : x < x2 ? botEdge[1] : x < x3 ? botEdge[2] : botEdge[3]);

            let path = [];
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

          {/* Right outer border */}
          <line x1={right} y1={topEdge[3]} x2={right} y2={botEdge[3]} stroke={CUT_COLOR} strokeWidth={CUT_W}/>

          {/* TOP flap heights */}
          {showDims && (
            <>
              {dimLine((x1 + x2) / 2, topEdge[1], (x1 + x2) / 2, yTopScore, "tp2")}
              <DimText x={(x1 + x2) / 2} y={(topEdge[1] + yTopScore) / 2} text={`${topP2h} mm`} />
              {dimLine((x2 + x3) / 2, topEdge[2], (x2 + x3) / 2, yTopScore, "tp3")}
              <DimText x={(x2 + x3) / 2} y={(topEdge[2] + yTopScore) / 2} text={`${topP3h} mm`} />
            </>
          )}

          {/* BOTTOM flap heights */}
          {showDims && (
            <>
              {dimLine((x1 + x2) / 2, yBotScore, (x1 + x2) / 2, botEdge[1], "bp2")}
              <DimText x={(x1 + x2) / 2} y={(yBotScore + botEdge[1]) / 2} text={`${botP2h} mm`} />
              {dimLine((x2 + x3) / 2, yBotScore, (x2 + x3) / 2, botEdge[2], "bp3")}
              <DimText x={(x2 + x3) / 2} y={(yBotScore + botEdge[2]) / 2} text={`${botP3h} mm`} />
            </>
          )}

          {/* Overall S2S (right) */}
          {showDims && (
            <>
              {dimLine(right + DIM_GAP / 2, yTopScore, right + DIM_GAP / 2, yBotScore, "s2s")}
              <DimText x={right + DIM_GAP / 2} y={(yTopScore + yBotScore) / 2} text={`${model.s2s} mm`} />
            </>
          )}

          {/* Panel widths */}
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

          {/* Sheet length at top */}
          {showDims && (
            <>
              {dimLine(sheetLenPxLeft, top + 8, sheetLenPxRight, top + 8, "sheet")}
              <DimText x={sheetLenMidX} y={top + 8} text={`${dieWmm} mm`} />
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
    </div>
  );
}
