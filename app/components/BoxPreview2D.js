// app/components/BoxPreview2D.js
"use client";

import { useMemo, useLayoutEffect, useRef, useState } from "react";

const DIM_COLOR = "#2e7d32";
const SCORE_COLOR = "#c62828";
const CUT_COLOR = "#000";
const SCORE_W = 1;
const CUT_W = 1.5;

const FONT = 12;
const LABEL_GAP = 60;
const DIM_GAP = 40;

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
      <rect x={x0 - pad} y={y - approxH / 2 - pad} width={approxW + 2 * pad} height={approxH + 2 * pad} fill="white" opacity="0.9" rx="2" ry="2"/>
      <text x={x} y={y} fontSize={FONT} dominantBaseline="middle" textAnchor={align} fill={DIM_COLOR}>{text}</text>
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
  const s2s = r(H + h1);
  const refFlap = r(W / 2);
  const totalWidth = panels.reduce((A, B) => A + B, 0) + r(glueLap);
  const totalHeight = refFlap + s2s + refFlap;
  return { panels, s2s, refFlap, totalWidth, totalHeight, glueLap: r(glueLap), seq, addsArr };
}

export default function BoxPreview2D({ inputs }) {
  const {
    L, W, H,
    thickness,
    glueSide, glueOff,
    glueLap, glueExt,
    bevelDeg, slotWidth,
    gapTopInner, gapTopOuter, gapBotInner, gapBotOuter,
    adds, showDims, showLabels,
  } = inputs;

  // container sizing
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
  // keep simple: H1 approx = 2 * thickness (you can wire your table later)
  const rscH1 = 2 * (+thickness || 0);

  const model = useMemo(
    () =>
      computeRSC({
        L, W, H,
        glueLap,
        adds,
        start: glueOff === "large" ? "L" : "W",
        h1: rscH1,
      }),
    [L, W, H, glueLap, adds, glueOff, rscH1]
  );

  const dieWmm = model.totalWidth;
  const dieHmm = model.totalHeight;

  const PAD = 24;
  const viewW = Math.max(200, wrapSize.w - 2 * PAD);
  const viewH = Math.max(200, wrapSize.h - 2 * PAD);
  const sFit = Math.min(viewW / dieWmm, viewH / dieHmm);
  const mm = (v) => v * sFit;

  const left = PAD + mm(model.glueLap);
  const top = PAD;
  const right = PAD + mm(dieWmm);
  const bottom = PAD + mm(dieHmm);

  const x1 = left + mm(model.panels[0]);
  const x2 = x1 + mm(model.panels[1]);
  const x3 = x2 + mm(model.panels[2]);

  const yTopScore = top + mm(model.refFlap);
  const yBotScore = top + mm(model.refFlap + model.s2s);

  const labelX = left - LABEL_GAP;

  const dimLine = (x1, y1, x2, y2, key) => (
    <line key={key} x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={DIM_COLOR} strokeWidth={1.25}
      markerStart="url(#dimArrowGreen)" markerEnd="url(#dimArrowGreen)"/>
  );

  // flap heights (match the “old good” formulas)
  const P2mm = model.panels[1];
  const P3mm = model.panels[2];

  const topP2h = Math.max(0, flr((P3mm - 2 - (+gapTopOuter || 0)) / 2));
  const topP3h = Math.max(0, flr((P2mm - 2 - (+gapTopInner || 0)) / 2));
  const botP2h = Math.max(0, flr((P3mm - 2 - (+gapBotOuter || 0)) / 2));
  const botP3h = Math.max(0, flr((P2mm - 2 - (+gapBotInner || 0)) / 2));

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

  // glue-lap chamfers & slot
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

  const sheetLenPxLeft = left;
  const sheetLenPxRight = right;
  const sheetLenMidX = (sheetLenPxLeft + sheetLenPxRight) / 2;

  return (
    <div ref={wrapRef} className="border rounded-lg bg-white overflow-hidden" style={{ height: 620 }}>
      <svg width="100%" height="100%">
        <DimMarkers />

        {/* (no inputs on the right side; only drawing) */}

        {/* glue-lap chamfers & slot */}
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

        {/* scores across width */}
        <line x1={PAD} y1={yTopScore} x2={right} y2={yTopScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W}/>
        <line x1={PAD} y1={yBotScore} x2={right} y2={yBotScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W}/>

        {/* vertical panel scores in body */}
        {[left, x1, x2, x3].map((xx, i) => (
          <line key={`bodyV-${i}`} x1={xx} y1={yTopScore} x2={xx} y2={yBotScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W}/>
        ))}

        {/* TOP boundary with slot interruptions */}
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

        {/* BOTTOM boundary with slot interruptions */}
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

        {/* right border between tops/bottoms */}
        <line x1={right} y1={topEdge[3]} x2={right} y2={botEdge[3]} stroke={CUT_COLOR} strokeWidth={CUT_W}/>

        {/* Dimensions & labels */}
        {showDims && (
          <>
            {/* top flap heights (P2, P3) */}
            {dimLine((x1 + x2) / 2, topEdge[1], (x1 + x2) / 2, yTopScore, "tp2")}
            <DimText x={(x1 + x2) / 2} y={(topEdge[1] + yTopScore) / 2} text={`${flr((P3mm - 2 - (+gapTopOuter || 0)) / 2)} mm`} />
            {dimLine((x2 + x3) / 2, topEdge[2], (x2 + x3) / 2, yTopScore, "tp3")}
            <DimText x={(x2 + x3) / 2} y={(topEdge[2] + yTopScore) / 2} text={`${flr((P2mm - 2 - (+gapTopInner || 0)) / 2)} mm`} />

            {/* bottom flap heights (P2, P3) */}
            {dimLine((x1 + x2) / 2, yBotScore, (x1 + x2) / 2, botEdge[1], "bp2")}
            <DimText x={(x1 + x2) / 2} y={(yBotScore + botEdge[1]) / 2} text={`${flr((P3mm - 2 - (+gapBotOuter || 0)) / 2)} mm`} />
            {dimLine((x2 + x3) / 2, yBotScore, (x2 + x3) / 2, botEdge[2], "bp3")}
            <DimText x={(x2 + x3) / 2} y={(yBotScore + botEdge[2]) / 2} text={`${flr((P2mm - 2 - (+gapBotInner || 0)) / 2)} mm`} />

            {/* overall S2S */}
            {dimLine(right + DIM_GAP / 2, yTopScore, right + DIM_GAP / 2, yBotScore, "s2s")}
            <DimText x={right + DIM_GAP / 2} y={(yTopScore + yBotScore) / 2} text={`${model.s2s} mm`} />

            {/* panel widths along bottom */}
            {dimLine(left, bottom - 16, x1, bottom - 16, "p1w")}
            <DimText x={(left + x1) / 2} y={bottom - 24} text={`${model.panels[0]} mm`} />

            {dimLine(x1, bottom - 16, x2, bottom - 16, "p2w")}
            <DimText x={(x1 + x2) / 2} y={bottom - 24} text={`${model.panels[1]} mm`} />

            {dimLine(x2, bottom - 16, x3, bottom - 16, "p3w")}
            <DimText x={(x2 + x3) / 2} y={bottom - 24} text={`${model.panels[2]} mm`} />

            {dimLine(x3, bottom - 16, right, bottom - 16, "p4w")}
            <DimText x={(x3 + right) / 2} y={bottom - 24} text={`${model.panels[3]} mm`} />

            {/* sheet length at top */}
            {dimLine(sheetLenPxLeft, top + 8, sheetLenPxRight, top + 8, "sheet")}
            <DimText x={sheetLenMidX} y={top + 8} text={`${dieWmm} mm`} />
          </>
        )}

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
