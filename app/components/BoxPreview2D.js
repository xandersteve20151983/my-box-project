"use client";

import React, { useMemo, useRef, useLayoutEffect, useState } from "react";

/* =============================== Constants =============================== */
const DIM_COLOR = "#2e7d32";   // green – dimensions
const SCORE_COLOR = "#c62828"; // red – scores
const CUT_COLOR = "#000";      // black – cutting outline
const SCORE_W = 1;
const CUT_W = 1.5;

const FONT = 12;
const LABEL_GAP = 60; // px away from outline for Top/Body/Bottom labels
const DIM_GAP = 40;   // px away from outline for vertical dim plates

// flute thickness (mm)
const FLUTE_THICKNESS = {
  E: 2, R: 2.5, B: 3, C: 4, A: 5, BE: 5, BR: 5.5, BC: 7, AC: 9,
};

/* ============================ Allowance table ============================ */
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

/* ================================ Helpers ================================ */
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
      <text x={x} y={y} fontSize={FONT} dominantBaseline="middle" textAnchor={align} fill={DIM_COLOR}>
        {text}
      </text>
    </>
  );
}

/* =========================== FEFCO 0201 model ============================ */
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

  const s2s = r(H + h1); // H + H1
  const refFlap = r(W / 2);
  const totalWidth = panels.reduce((A, B) => A + B, 0) + r(glueLap);
  const totalHeight = refFlap + s2s + refFlap;

  return { panels, s2s, refFlap, totalWidth, totalHeight, glueLap: r(glueLap) };
}

/* ================================ Component ============================== */
export default function BoxPreview2D(props) {
  const {
    // when false, hide internal controls and use values passed from props
    controls = true,

    // external values (optional)
    L: pL, W: pW, H: pH,
    flute: pFlute,
    glueSide: pGlueSide,          // "inside" | "outside"
    glueOff: pGlueOff,            // "small" | "large"  (off on small/large panel)
    glue: pGlue,                  // glue lap width
    glueExt: pGlueExt,            // extension a (mm)
    bevelDeg: pBevelDeg,          // bevel angle from horizontal
    slotWidth: pSlotWidth,        // slot (score interruption) width
    gapTopInner: pGTI, gapTopOuter: pGTO,
    gapBotInner: pGBI, gapBotOuter: pGBO,
    showDims: pShowDims, showLabels: pShowLabels,
  } = props;

  /* ---------- local state (used only when controls === true) ---------- */
  const [L, setL] = useState(267);
  const [W, setW] = useState(120);
  const [H, setH] = useState(80);

  const [flute, setFlute] = useState("B");
  const [glueSide, setGlueSide] = useState("outside");
  const [glueOff, setGlueOff] = useState("small");

  const [glue, setGlue] = useState(28);
  const [glueExt, setGlueExt] = useState(0);
  const [bevelDeg, setBevelDeg] = useState(24);

  const [slotWidth, setSlotWidth] = useState(9);

  const [gapTopInner, setGapTopInner] = useState(147);
  const [gapTopOuter, setGapTopOuter] = useState(0);
  const [gapBotInner, setGapBotInner] = useState(147);
  const [gapBotOuter, setGapBotOuter] = useState(0);

  const [showDims, setShowDims] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  // resolved values (props override local state)
  const Lx = pL ?? L;  const Wx = pW ?? W;  const Hx = pH ?? H;
  const flutex = pFlute ?? flute;
  const glueSidex = pGlueSide ?? glueSide;
  const glueOffx = pGlueOff ?? glueOff;
  const gluex = pGlue ?? glue;
  const glueExtx = pGlueExt ?? glueExt;
  const bevelDegx = pBevelDeg ?? bevelDeg;
  const slotWidthx = pSlotWidth ?? slotWidth;
  const gapTopInnerx = pGTI ?? gapTopInner;
  const gapTopOuterx = pGTO ?? gapTopOuter;
  const gapBotInnerx = pGBI ?? gapBotInner;
  const gapBotOuterx = pGBO ?? gapBotOuter;
  const showDimsx = pShowDims ?? showDims;
  const showLabelsx = pShowLabels ?? showLabels;

  /* ---------- fit-to-view sizing ---------- */
  const wrapRef = useRef(null);
  const [wrapSize, setWrapSize] = useState({ w: 1200, h: 620 });
  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const rr = entries[0].contentRect;
      setWrapSize({ w: rr.width, h: rr.height });
    });
    obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  /* ---------- allowances/geometry ---------- */
  const thickness = FLUTE_THICKNESS[(flutex || "B").toUpperCase()] || 3;
  const addsRow = getAllowances(glueSidex, flutex);
  const rscH1 = +addsRow?.rscH1 || 2 * thickness;
  const flapAllowance = +addsRow?.flap || 0;

  const model = useMemo(
    () =>
      computeRSC({
        L: +Lx,
        W: +Wx,
        H: +Hx,
        glueLap: +gluex,
        adds: {
          P1: +addsRow.P1 || 0,
          P2: +addsRow.P2 || 0,
          P3: +addsRow.P3 || 0,
          P4: +addsRow.P4 || 0,
        },
        start: glueOffx === "large" ? "L" : "W",
        h1: rscH1,
      }),
    [Lx, Wx, Hx, gluex, addsRow, glueOffx, rscH1]
  );

  // totals (mm)
  const dieWmm = model.totalWidth;
  const dieHmm = model.totalHeight;

  // scale for fit-to-view
  const PAD = 24;
  const viewW = Math.max(200, wrapSize.w - 2 * PAD);
  const viewH = Math.max(200, wrapSize.h - 2 * PAD);
  const sFit = Math.min(viewW / dieWmm, viewH / dieHmm);
  const mm = (v) => v * sFit;

  // outline edges (px)
  const left = PAD + mm(model.glueLap);
  const top = PAD;
  const right = PAD + mm(dieWmm);
  const bottom = PAD + mm(dieHmm);

  // panel breakpoints (px)
  const x1 = left + mm(model.panels[0]);
  const x2 = x1 + mm(model.panels[1]);
  const x3 = x2 + mm(model.panels[2]);

  // scores Y (px)
  const yTopScore = top + mm(model.refFlap);
  const yBotScore = top + mm(model.refFlap + model.s2s);

  // labels/plates X
  const labelX = left - LABEL_GAP;

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

  /* ---------- flap heights from gaps ---------- */
  const P2mm = model.panels[1];
  const P3mm = model.panels[2];

  const topP2h = Math.max(0, flr((P3mm - 2 - (+gapTopOuterx || 0)) / 2 + flapAllowance));
  const topP3h = Math.max(0, flr((P2mm - 2 - (+gapTopInnerx || 0)) / 2 + flapAllowance));
  const botP2h = Math.max(0, flr((P3mm - 2 - (+gapBotOuterx || 0)) / 2 + flapAllowance));
  const botP3h = Math.max(0, flr((P2mm - 2 - (+gapBotInnerx || 0)) / 2 + flapAllowance));

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

  /* ---------- glue lap slot + chamfers ---------- */
  const swPx = Math.max(0.5, +slotWidthx) * sFit;
  const glueHalf = Math.min(swPx / 2, Math.max(0, left - (PAD + 0.75)));
  const hasGlueSlot = glueHalf > 0;
  const glueSlot = hasGlueSlot ? [left - glueHalf, left + glueHalf] : null;

  const xChamferStart = glueSlot ? glueSlot[0] : left;
  const meetTopY = topEdge[0];
  const meetBotY = botEdge[0];

  const runPx = Math.max(0, xChamferStart - PAD);
  const angleRad = clamp((+bevelDegx || 0) * (Math.PI / 180), 0.1, Math.PI / 2);
  const autoV = runPx * Math.tan(angleRad);
  const extPx = mm(Math.max(0, +glueExtx || 0));
  const vChange = extPx > 0 ? extPx : autoV;

  const chamferTopY = Math.min(bottom, meetTopY + vChange);
  const chamferBotY = Math.max(top, meetBotY - vChange);

  /* ================================ Render =============================== */
  return (
    <div className="space-y-3">
      {controls && (
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 text-sm items-end">
          <label className="flex flex-col"><span>Internal Length (L, mm)</span>
            <input type="number" value={L} onChange={(e) => setL(+e.target.value)} className="border rounded p-1" />
          </label>
          <label className="flex flex-col"><span>Internal Width (W, mm)</span>
            <input type="number" value={W} onChange={(e) => setW(+e.target.value)} className="border rounded p-1" />
          </label>
          <label className="flex flex-col"><span>Internal Height (H, mm)</span>
            <input type="number" value={H} onChange={(e) => setH(+e.target.value)} className="border rounded p-1" />
          </label>

          <label className="flex flex-col"><span>Flute</span>
            <select value={flute} onChange={(e) => setFlute(e.target.value)} className="border rounded p-1">
              {Object.keys(FLUTE_THICKNESS).map((f) => (
                <option key={f} value={f}>{f} ({FLUTE_THICKNESS[f]} mm)</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col"><span>Glue position</span>
            <select value={glueSide} onChange={(e) => setGlueSide(e.target.value)} className="border rounded p-1">
              <option value="inside">Inside glue</option>
              <option value="outside">Outside glue</option>
            </select>
          </label>

          <label className="flex flex-col"><span>Glue lap off</span>
            <select value={glueOff} onChange={(e) => setGlueOff(e.target.value)} className="border rounded p-1">
              <option value="small">Small panel (W)</option>
              <option value="large">Large panel (L)</option>
            </select>
          </label>

          <label className="flex flex-col"><span>Glue lap (mm)</span>
            <input type="number" value={glue} onChange={(e) => setGlue(+e.target.value)} className="border rounded p-1" />
          </label>

          <label className="flex flex-col"><span>Glue lap extension a (mm)</span>
            <input type="number" step="0.5" value={glueExt} onChange={(e) => setGlueExt(+e.target.value)} className="border rounded p-1" />
          </label>

          <label className="flex flex-col"><span>Bevel angle (°)</span>
            <input type="number" step="0.5" value={bevelDeg} onChange={(e) => setBevelDeg(+e.target.value)} className="border rounded p-1" />
          </label>

          <label className="flex flex-col"><span>Slot width (mm)</span>
            <input type="number" step="0.5" value={slotWidth} onChange={(e) => setSlotWidth(+e.target.value)} className="border rounded p-1" />
          </label>

          <label className="flex flex-col"><span>Flap gap (Top Inner)</span>
            <input type="number" step="0.5" value={gapTopInner} onChange={(e) => setGapTopInner(+e.target.value)} className="border rounded p-1" />
          </label>
          <label className="flex flex-col"><span>Flap gap (Top Outer)</span>
            <input type="number" step="0.5" value={gapTopOuter} onChange={(e) => setGapTopOuter(+e.target.value)} className="border rounded p-1" />
          </label>
          <label className="flex flex-col"><span>Flap gap (Bottom Inner)</span>
            <input type="number" step="0.5" value={gapBotInner} onChange={(e) => setGapBotInner(+e.target.value)} className="border rounded p-1" />
          </label>
          <label className="flex flex-col"><span>Flap gap (Bottom Outer)</span>
            <input type="number" step="0.5" value={gapBotOuter} onChange={(e) => setGapBotOuter(+e.target.value)} className="border rounded p-1" />
          </label>

          <label className="flex items-center gap-2 col-span-2">
            <input type="checkbox" checked={showDims} onChange={(e) => setShowDims(e.target.checked)} />
            <span>Show dimensions</span>
          </label>
          <label className="flex items-center gap-2 col-span-2">
            <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
            <span>Show labels</span>
          </label>
        </div>
      )}

      <div className="text-sm font-mono">
        {`FEFCO 0201 — internal L=${Lx} W=${Wx} H=${Hx} | flute=${flutex} t=${thickness} | glue=${model.glueLap} | glueSide=${glueSidex} | glueOff=${glueOffx} | adds P1=${addsRow.P1} P2=${addsRow.P2} P3=${addsRow.P3} P4=${addsRow.P4} | a=${glueExtx} | angle=${bevelDegx}° | S2S = H + H1 → ${model.s2s} mm | sheet=${model.totalWidth}×${model.totalHeight} mm`}
      </div>

      <div ref={wrapRef} className="border rounded-lg bg-white overflow-hidden" style={{ height: 620 }}>
        <svg width="100%" height="100%">
          <DimMarkers />

          {/* Section titles */}
          {showLabelsx && (
            <>
              <text x={labelX} y={(top + yTopScore) / 2} fontSize={FONT} textAnchor="end">Top Flaps</text>
              <text x={labelX} y={(yTopScore + yBotScore) / 2} fontSize={FONT} textAnchor="end">Body</text>
              <text x={labelX} y={(yBotScore + bottom) / 2} fontSize={FONT} textAnchor="end">Bottom Flaps</text>
            </>
          )}

          {/* Glue-lap chamfers + short left edge */}
          {chamferBotY > chamferTopY && (
            <line x1={PAD} y1={chamferTopY} x2={PAD} y2={chamferBotY} stroke={CUT_COLOR} strokeWidth={CUT_W} />
          )}
          <line x1={xChamferStart} y1={meetTopY} x2={PAD} y2={chamferTopY} stroke={CUT_COLOR} strokeWidth={CUT_W} />
          <line x1={xChamferStart} y1={meetBotY} x2={PAD} y2={chamferBotY} stroke={CUT_COLOR} strokeWidth={CUT_W} />

          {/* Slot shows as score interruptions on glue-lap */}
          {hasGlueSlot && (
            <>
              <line x1={glueSlot[0]} y1={yTopScore} x2={glueSlot[1]} y2={yTopScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W} />
              <line x1={glueSlot[0]} y1={yBotScore} x2={glueSlot[1]} y2={yBotScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W} />
            </>
          )}

          {/* Global scores */}
          <line x1={PAD} y1={yTopScore} x2={right} y2={yTopScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W} />
          <line x1={PAD} y1={yBotScore} x2={right} y2={yBotScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W} />

          {/* Body vertical scores */}
          {[left, x1, x2, x3].map((xx, i) => (
            <line key={`bodyV-${i}`} x1={xx} y1={yTopScore} x2={xx} y2={yBotScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W} />
          ))}

          {/* Top cutting boundary with interruptions */}
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

          {/* Bottom cutting boundary with interruptions */}
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

          {/* Right outside edge */}
          <line x1={right} y1={topEdge[3]} x2={right} y2={botEdge[3]} stroke={CUT_COLOR} strokeWidth={CUT_W} />

          {/* Dimensions */}
          {showDimsx && (
            <>
              {/* top P2/P3 heights */}
              {dimLine((x1 + x2) / 2, topEdge[1], (x1 + x2) / 2, yTopScore, "tp2")}
              <DimText x={(x1 + x2) / 2} y={(topEdge[1] + yTopScore) / 2} text={`${topP2h} mm`} />
              {dimLine((x2 + x3) / 2, topEdge[2], (x2 + x3) / 2, yTopScore, "tp3")}
              <DimText x={(x2 + x3) / 2} y={(topEdge[2] + yTopScore) / 2} text={`${topP3h} mm`} />

              {/* bottom P2/P3 heights */}
              {dimLine((x1 + x2) / 2, yBotScore, (x1 + x2) / 2, botEdge[1], "bp2")}
              <DimText x={(x1 + x2) / 2} y={(yBotScore + botEdge[1]) / 2} text={`${botP2h} mm`} />
              {dimLine((x2 + x3) / 2, yBotScore, (x2 + x3) / 2, botEdge[2], "bp3")}
              <DimText x={(x2 + x3) / 2} y={(yBotScore + botEdge[2]) / 2} text={`${botP3h} mm`} />

              {/* S2S on far right */}
              {dimLine(right + DIM_GAP / 2, yTopScore, right + DIM_GAP / 2, yBotScore, "s2s")}
              <DimText x={right + DIM_GAP / 2} y={(yTopScore + yBotScore) / 2} text={`${model.s2s} mm`} />

              {/* bottom panel widths */}
              {dimLine(left, bottom - 16, x1, bottom - 16, "p1w")}
              <DimText x={(left + x1) / 2} y={bottom - 24} text={`${model.panels[0]} mm`} />
              {dimLine(x1, bottom - 16, x2, bottom - 16, "p2w")}
              <DimText x={(x1 + x2) / 2} y={bottom - 24} text={`${model.panels[1]} mm`} />
              {dimLine(x2, bottom - 16, x3, bottom - 16, "p3w")}
              <DimText x={(x2 + x3) / 2} y={bottom - 24} text={`${model.panels[2]} mm`} />
              {dimLine(x3, bottom - 16, right, bottom - 16, "p4w")}
              <DimText x={(x3 + right) / 2} y={bottom - 24} text={`${model.panels[3]} mm`} />

              {/* sheet length on top */}
              {dimLine(left, top + 8, right, top + 8, "sheet")}
              <DimText x={(left + right) / 2} y={top + 8} text={`${dieWmm} mm`} />
            </>
          )}

          {/* panel titles */}
          {showLabelsx && (
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
