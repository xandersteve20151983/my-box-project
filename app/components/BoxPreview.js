"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { loadFluteTable } from "../lib/fluteStore";
import { loadPanelAllowances } from "../lib/panelAllowanceStore";
import dynamic from "next/dynamic";

// BoxPreview.js is in app/components, so this relative path is correct:
const PalletisationPanel = dynamic(
  () => import("./pallets/PalletisationPanel.client"),
  { ssr: false }
);


/* ---------- styling ---------- */
const DIM_COLOR = "#2e7d32";   // green – dimensions
const SCORE_COLOR = "#c62828"; // red – scores
const SCORE_W = 1;

const fmt = (mm) => `${Math.round(mm)} mm`;

/* ---------- FEFCO style data ---------- */
const PARENT_STYLES = [
  { code: "0100", name: "Commercial rolls & sheets", disabled: true },
  { code: "0200", name: "Slotted boxes", disabled: false },
  { code: "0300", name: "Telescopic boxes", disabled: true },
  { code: "0400", name: "Folder boxes & trays", disabled: true },
  { code: "0500", name: "Slide boxes", disabled: true },
  { code: "0600", name: "Rigid boxes", disabled: true },
  { code: "0700", name: "Ready-glued cases", disabled: true },
  { code: "0800", name: "Retail & e-commerce", disabled: true },
  { code: "0900", name: "Interior fitments", disabled: true },
];

const CHILD_BY_PARENT = {
  "0200": [
    { code: "0200", name: "0200" },
    { code: "0201", name: "0201 – RSC (Regular Slotted Case)" },
    { code: "0202", name: "0202" },
    { code: "0203", name: "0203" },
    { code: "0204", name: "0204" },
    { code: "0205", name: "0205" },
    { code: "0206", name: "0206" },
  ],
};

const STYLE_VISUALS = [
  { code: "0200", name: "0200" },
  { code: "0201", name: "0201 – RSC" },
  { code: "0202", name: "0202" },
  { code: "0203", name: "0203" },
  { code: "0204", name: "0204" },
  { code: "0205", name: "0205" },
  { code: "0206", name: "0206" },
];

/** FEFCO 0201 RSC geometry (mm) */
function computeRSC({ L, W, H, t, glue, adds, start = "W", h1 = 2 * t }) {
  const a = { p1: 0, p2: 0, p3: 0, p4: 0, ...(adds || {}) };
  const seq = start === "L" ? ["L", "W", "L", "W"] : ["W", "L", "W", "L"];
  const raw = [
    seq[0] === "W" ? W : L,
    seq[1] === "W" ? W : L,
    seq[2] === "W" ? W : L,
    seq[3] === "W" ? W : L,
  ];
  const addsArr = [a.p1, a.p2, a.p3, a.p4];
  const panels = raw.map((base, i) => Math.round(base + (addsArr[i] || 0)));

  const s2s = Math.round(H + h1);      // S2S = Int H + RSC_H1
  const flap = Math.round(W / 2);      // nominal flap height each side (before gaps)
  const totalWidth = panels.reduce((A, B) => A + B, 0) + Math.round(glue);
  const totalHeight = flap + s2s + flap;

  return { panels, s2s, flap, totalWidth, totalHeight, glue: Math.round(glue), seq, addsArr };
}

/* ---------- fixed-font helpers ---------- */
const FONT = 12;
const LINE_H = Math.round(FONT * 1.25);
const PAD = 3;
const TICK_LEN = 8;

function VDim({ x, y1, y2, head, lines = [], side = 1, color = DIM_COLOR }) {
  const textLines = [head, ...lines];
  const maxLen = textLines.reduce((m, s) => Math.max(m, (s || "").length), 0);
  const approxW = Math.max(32, Math.round(maxLen * FONT * 0.55));
  const approxH = LINE_H * textLines.length;
  const tx = x + 12 * (side > 0 ? 1 : -1);
  const ty = (y1 + y2) / 2 - (approxH / 2) + LINE_H / 2;

  return (
    <g>
      <defs>
        <marker id="dimArrowGreenLocal" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5 Z" fill={color} />
        </marker>
      </defs>
      <line
        x1={x} y1={y1} x2={x} y2={y2}
        stroke={color} strokeWidth="1.25"
        markerStart="url(#dimArrowGreenLocal)" markerEnd="url(#dimArrowGreenLocal)"
      />
      <rect
        x={tx - approxW / 2 - PAD} y={ty - LINE_H / 2 - PAD}
        width={approxW + 2 * PAD} height={approxH + 2 * PAD}
        fill="white" opacity="0.9" rx={2} ry={2}
      />
      <text x={tx} y={ty} fontSize={FONT} textAnchor="middle" dominantBaseline="middle" fill="black">
        <tspan x={tx} dy="0">{head}</tspan>
        {lines.map((ln, i) => (
          <tspan key={i} x={tx} dy={LINE_H}>{ln}</tspan>
        ))}
      </text>
    </g>
  );
}

function PlateText({ x, y, head, lines = [], color = DIM_COLOR }) {
  const textLines = [head, ...lines];
  const maxLen = textLines.reduce((m, s) => Math.max(m, (s || "").length), 0);
  const approxW = Math.max(32, Math.round(maxLen * FONT * 0.55));
  const approxH = LINE_H * textLines.length;
  return (
    <g>
      <rect
        x={x - approxW / 2 - PAD} y={y - LINE_H / 2 - PAD}
        width={approxW + 2 * PAD} height={approxH + 2 * PAD}
        fill="white" opacity="0.9" rx={2} ry={2}
      />
      <text x={x} y={y} fontSize={FONT} textAnchor="middle" dominantBaseline="middle" fill={color}>
        <tspan x={x} dy="0">{head}</tspan>
        {lines.map((ln, i) => (
          <tspan key={i} x={x} dy={LINE_H}>{ln}</tspan>
        ))}
      </text>
    </g>
  );
}

/* ========= responsive drawing window ========= */
const MIN_H = 380;
const MAX_H = 760;

/* --------- fixed invisible grid gutters --------- */
const LABEL_COL_W = 140;
const HEADER_ROW_H = 44;

/* ---------- Collapsible Section helper ---------- */
function Section({ title, openDefault = false, children }) {
  const [open, setOpen] = useState(openDefault);
  return (
    <div className="mt-4 border rounded-md">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-3 py-2 text-left bg-gray-50 hover:bg-gray-100"
      >
        <span className="inline-flex w-5 h-5 items-center justify-center border rounded">
          {open ? "−" : "+"}
        </span>
        <span className="font-medium">{title}</span>
      </button>
      {open && <div className="p-3">{children}</div>}
    </div>
  );
}

export default function BoxPreview() {
  /* ---------- selectors ---------- */
  const [parentStyle, setParentStyle] = useState("0200");
  const [style, setStyle] = useState("0201");
  const isRSC0201 = parentStyle === "0200" && style === "0201";
  const [showStyleGallery, setShowStyleGallery] = useState(false);

  /* ---------- inputs ---------- */
  const [L, setL] = useState(267);
  const [W, setW] = useState(120);
  const [H, setH] = useState(80);

  const [t, setT] = useState(3);
  const [glue, setGlue] = useState(28);

  const [glueExt, setGlueExt] = useState(0);
  const [bevelDeg, setBevelDeg] = useState(24);

  const [showDims, setShowDims] = useState(true);
  const [showFormulas, setShowFormulas] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

  const [slotWidth, setSlotWidth] = useState(9);

  const [flute, setFlute] = useState("B");
  const [glueSide, setGlueSide] = useState("outside");
  const [glueOff, setGlueOff] = useState("small");
  const [fluteTable, setFluteTable] = useState([]);
  const [allowances, setAllowances] = useState({ inside: [], outside: [] });

  // locks
  const [lockTop, setLockTop] = useState(false);
  const [lockBottom, setLockBottom] = useState(false);
  const [lockSymmetry, setLockSymmetry] = useState(false);
  const prevLocks = useRef({ top: false, bottom: false, sym: false });
  useEffect(() => {
    if (isRSC0201) {
      prevLocks.current = { top: lockTop, bottom: lockBottom, sym: lockSymmetry };
      setLockTop(true); setLockBottom(true); setLockSymmetry(true);
    } else {
      setLockTop(prevLocks.current.top);
      setLockBottom(prevLocks.current.bottom);
      setLockSymmetry(prevLocks.current.sym);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style, parentStyle]);

  // flap gaps (mm)
  const [gapTopInner, setGapTopInner] = useState(0);
  const [gapTopOuter, setGapTopOuter] = useState(0);
  const [gapBotInner, setGapBotInner] = useState(0);
  const [gapBotOuter, setGapBotOuter] = useState(0);
  const lastEdit = useRef(null);

  // responsive container
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 1200, h: 560 });

  useEffect(() => {
    const ft = loadFluteTable();
    setFluteTable(ft);
    if (!ft.find((f) => f.flute === flute) && ft[0]) setFlute(ft[0].flute);
    setAllowances(loadPanelAllowances(ft));
  }, []);

  useEffect(() => {
    const row = fluteTable.find((f) => f.flute === flute);
    if (row) setT(row.thickness);
  }, [flute, fluteTable]);

  // measure container & viewport
  useEffect(() => {
    function measure() {
      const w = containerRef.current?.clientWidth || 1200;
      const hMax = typeof window !== "undefined" ? window.innerHeight - 260 : 560;
      const h = Math.max(MIN_H, Math.min(MAX_H, hMax));
      setCanvasSize({ w, h });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const allowRow = useMemo(() => {
    const list = glueSide === "outside" ? allowances.outside : allowances.inside;
    return list.find((r) => (r.flute || "").toUpperCase() === (flute || "").toUpperCase());
  }, [allowances, glueSide, flute]);

  // RSC H1 lookup
  const rscH1 = useMemo(() => {
    if (!allowRow) return 2 * t;
    const norm = (s) => String(s).replace(/[^a-z0-9]/gi, "").toLowerCase();
    let best;
    function walk(obj, pathTokens) {
      if (!obj || typeof obj !== "object") return;
      for (const [k, v] of Object.entries(obj)) {
        const nk = norm(k);
        if (v && typeof v === "object") { walk(v, [...pathTokens, nk]); continue; }
        const num = +v; if (Number.isNaN(num)) continue;
        const pathStr = [...pathTokens, nk].join("/");
        if (pathStr.includes("rsc") && nk.endsWith("h1")) { best = num; return; }
        if (nk === "h1" && best === undefined) best = num;
        if (nk.endsWith("h1") && best === undefined) best = num;
      }
    }
    walk(allowRow, []);
    return best !== undefined ? best : 2 * t;
  }, [allowRow, t]);

  // RSC FLAP lookup
  const rscFlap = useMemo(() => {
    if (!allowRow) return 0;
    const norm = (s) => String(s).replace(/[^a-z0-9]/gi, "").toLowerCase();
    let best;
    function walk(obj, pathTokens) {
      if (!obj || typeof obj !== "object") return;
      for (const [k, v] of Object.entries(obj)) {
        const nk = norm(k);
        if (v && typeof v === "object") { walk(v, [...pathTokens, nk]); continue; }
        const num = +v; if (Number.isNaN(num)) continue;
        const pathStr = [...pathTokens, nk].join("/");
        if (pathStr.includes("rsc") && nk.endsWith("flap")) { best = num; return; }
        if (nk === "flap" && best === undefined) best = num;
        if (nk.endsWith("flap") && best === undefined) best = num;
      }
    }
    walk(allowRow, []);
    return best !== undefined ? best : 0;
  }, [allowRow]);

  const panelAdds = useMemo(
    () => allowRow?.panels || { p1: 0, p2: 0, p3: 0, p4: 0 },
    [allowRow]
  );

  const g = useMemo(
    () =>
      computeRSC({
        L: +L, W: +W, H: +H, t: +t,
        glue: +glue,
        adds: panelAdds,
        start: glueOff === "large" ? "L" : "W",
        h1: rscH1,
      }),
    [L, W, H, t, glue, panelAdds, glueOff, rscH1]
  );

  /* ===== margins include reserved gutters ===== */
  const margins = useMemo(() => {
    const baseLeft = 60, baseTop = 48, right = 140, bottom = 150;
    const left  = baseLeft + (showLabels ? LABEL_COL_W : 0);
    const top   = baseTop  + (showLabels ? HEADER_ROW_H : 0);
    return { left, right, top, bottom };
  }, [showLabels]);

  /* ===== scale to fit ===== */
  const s = useMemo(() => {
    const innerW = canvasSize.w - (margins.left + margins.right);
    const innerH = canvasSize.h - (margins.top + margins.bottom);
    const sx = innerW / g.totalWidth;
    const sy = innerH / g.totalHeight;
    return Math.max(0.1, Math.min(sx, sy));
  }, [canvasSize, margins, g.totalWidth, g.totalHeight]);

  /* ===== derived pixels ===== */
  const dieW = g.totalWidth * s;
  const dieH = g.totalHeight * s;

  const svgW = canvasSize.w;
  const svgH = canvasSize.h;

  const left = margins.left;
  const top  = margins.top;
  const right = left + dieW;
  const bottom = top + dieH;

  // panel x’s
  const x0 = left + g.glue * s;
  const x1 = x0 + g.panels[0] * s;
  const x2 = x1 + g.panels[1] * s;
  const x3 = x2 + g.panels[2] * s;
  const x4 = x3 + g.panels[3] * s;

  const yTopScore = top + g.flap * s;
  const yBotScore = top + (g.flap + g.s2s) * s;

  // slot width
  const swPx = Math.max(0.5, +slotWidth) * s;
  const glueHalf = Math.min(swPx / 2, Math.max(0, x0 - left - 0.75));
  const glueSlot = glueHalf > 0 ? [x0 - glueHalf, x0 + glueHalf] : null;

  const P2 = g.panels[1];
  const P3 = g.panels[2];
  const delta = P3 - P2;

  // seed gaps
  useEffect(() => {
    const seed = Math.max(0, P2 - 2 * g.flap - (+t));
    setGapTopInner(seed);
    setGapBotInner(seed);
    setGapTopOuter(0);
    setGapBotOuter(0);
    lastEdit.current = null;
  }, [P2, P3, t, g.flap]);

  // respect locks/symmetry
  useEffect(() => {
    let ti = +gapTopInner, to = +gapTopOuter, bi = +gapBotInner, bo = +gapBotOuter;
    const from = lastEdit.current;

    if (lockSymmetry) {
      if (from === "ti") bi = ti; else if (from === "bi") ti = bi;
      if (from === "to") bo = to; else if (from === "bo") to = bo;
    }
    if (lockTop) {
      if (from === "to" || from === "bo") ti = to - delta;
      else to = ti + delta;
    }
    if (lockBottom) {
      if (from === "bo" || from === "to") bi = bo - delta;
      else bo = bi + delta;
    }
    if (lockSymmetry) { bi = ti; bo = to; }

    const eps = 1e-6;
    const changed =
      Math.abs(ti - gapTopInner) > eps ||
      Math.abs(to - gapTopOuter) > eps ||
      Math.abs(bi - gapBotInner) > eps ||
      Math.abs(bo - gapBotOuter) > eps;

    if (changed) { setGapTopInner(ti); setGapTopOuter(to); setGapBotInner(bi); setGapBotOuter(bo); }
  }, [gapTopInner, gapTopOuter, gapBotInner, gapBotOuter, lockTop, lockBottom, lockSymmetry, delta]);

  /* ========= flap edges from gaps ========= */
  const topInsetInnerPx = ((P2 - t - (+gapTopInner)) / 2) * s; // P1 & P3
  const topInsetOuterPx = ((P3 - t - (+gapTopOuter)) / 2) * s; // P2 & P4
  const botInsetInnerPx = ((P2 - t - (+gapBotInner)) / 2) * s; // P1 & P3
  const botInsetOuterPx = ((P3 - t - (+gapBotOuter)) / 2) * s; // P2 & P4

  const topEdge = [
    yTopScore - topInsetInnerPx,
    yTopScore - topInsetOuterPx,
    yTopScore - topInsetInnerPx,
    yTopScore - topInsetOuterPx,
  ];
  const botEdge = [
    yBotScore + botInsetInnerPx,
    yBotScore + botInsetOuterPx,
    yBotScore + botInsetInnerPx,
    yBotScore + botInsetOuterPx,
  ];

  const topHOuterDisp = Math.floor((+W / 2) + (+rscFlap) - (+gapTopOuter / 2));
  const topHInnerDisp = Math.floor((+L / 2) + (+rscFlap) - (+gapTopInner / 2));
  const botHOuterDisp = Math.floor((+W / 2) + (+rscFlap) - (+gapBotOuter / 2));
  const botHInnerDisp = Math.floor((+L / 2) + (+rscFlap) - (+gapBotInner / 2));

  const maxTopFlap    = Math.max(topHInnerDisp, topHOuterDisp);
  const maxBottomFlap = Math.max(botHInnerDisp, botHOuterDisp);

  const panelStarts = [x0, x1, x2, x3];
  const panelEnds   = [x1, x2, x3, x4];

  /* ===== Glue-lap chamfers (reusing left/right/top/bottom) ===== */
  const xChamferStart = glueSlot ? glueSlot[0] : x0;
  const runPx    = Math.max(0, xChamferStart - left);
  const angleRad = Math.max(0.1, Math.min(89.9, +bevelDeg)) * (Math.PI / 180);
  const risePx   = runPx * Math.tan(angleRad);
  const aPx      = Math.max(0, +glueExt) * s;

  const yTopSlot  = Math.max(topEdge[0], Math.min(yTopScore, yTopScore - aPx));
  const yBotSlot  = Math.min(botEdge[0], Math.max(yBotScore, yBotScore + aPx));
  const yChamferTopLeft = Math.min(bottom, Math.max(top, yTopSlot + risePx));
  const yChamferBotLeft = Math.min(bottom, Math.max(top, yBotSlot - risePx));

  /* ---------- helpers ---------- */
  const panelIndexAtX = (x) => (x < x1 ? 0 : x < x2 ? 1 : x < x3 ? 2 : 3);
  const yTopAt  = (x) => topEdge[panelIndexAtX(x)];
  const yBotAt  = (x) => botEdge[panelIndexAtX(x)];
  const dimTick = (x, y) => (<line x1={x} y1={y - TICK_LEN} x2={x} y2={y + TICK_LEN} stroke={DIM_COLOR} strokeWidth="1" />);

  const slotPairs = useMemo(() => {
    const pairs = [];
    if (glueSlot) pairs.push(glueSlot);
    for (const xc of [x1, x2, x3]) {
      pairs.push([xc - Math.max(0.5, +slotWidth) * s / 2, xc + Math.max(0.5, +slotWidth) * s / 2]);
    }
    return pairs;
  }, [glueSlot, x1, x2, x3, s, slotWidth]);

  const buildBoundaryPath = (isTop, ySlotStart) => {
    const yScore = isTop ? yTopScore : yBotScore;
    const yAt    = isTop ? yTopAt : yBotAt;

    const xs = glueSlot ? glueSlot[0] : x0;
    let d = `M ${xs} ${ySlotStart}`;

    slotPairs.forEach(([lx, rx], idx) => {
      const isGluePair = glueSlot && idx === 0;
      if (isGluePair) {
        d += ` L ${lx} ${yScore}`;
      } else {
        d += ` L ${lx} ${yAt(lx)}`;
        d += ` L ${lx} ${yScore}`;
      }
      d += ` L ${rx} ${yScore}`;
      d += ` L ${rx} ${yAt(rx)}`;
    });

    d += ` L ${right} ${yAt(right)}`;
    return d;
  };

  const topBoundaryPath = buildBoundaryPath(true,  yTopSlot);
  const botBoundaryPath = buildBoundaryPath(false, yBotSlot);

  const panelFormulaName = (k) => {
    const base = g.seq[k-1] === "W" ? "Int W" : "Int L";
    return `${base} + P${k} Allowance`;
  };
  const panelFormulaCalc = (k) => {
    const baseVal = g.seq[k-1] === "W" ? Math.round(W) : Math.round(L);
    const addVal = Math.round(g.addsArr[k-1] || 0);
    return `${baseVal} + ${addVal}`;
  };

  const sheetTopY = margins.top - (showLabels ? 0 : HEADER_ROW_H) + HEADER_ROW_H - 6;
  const panelDimY = bottom + 34;
  const overallDimX = margins.left - 36;

  const ffLength = Math.round(P2 + P3);
  const ffThickness = 2 * Math.round(t);
  const ffWidth = Math.round(maxTopFlap + (g.s2s) + maxBottomFlap);

  /* ===================== RENDER ===================== */
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Stephen’s Box Tool 🚀</h1>
        <Link className="underline text-blue-600" href="/admin">Admin</Link>
      </div>

      {/* Style selectors */}
      <div className="grid grid-cols-2 md:grid-cols-12 gap-3 items-end">
        <label className="flex flex-col md:col-span-3">
          <span>Parent style (FEFCO)</span>
          <select
            value={parentStyle}
            onChange={(e) => {
              const v = e.target.value;
              setParentStyle(v);
              const list = CHILD_BY_PARENT[v] || [];
              setStyle(list[0]?.code ?? "");
            }}
            className="border rounded p-1"
          >
            {PARENT_STYLES.map(p => (
              <option key={p.code} value={p.code} disabled={p.disabled}>
                {p.code} — {p.name}{p.disabled ? " (coming soon)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col md:col-span-5">
          <span className="flex items-center gap-2">
            Style
            <button
              type="button"
              onClick={() => setShowStyleGallery(true)}
              className="inline-flex items-center gap-1 text-blue-600 hover:underline"
              title="Show style visuals"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
              </svg>
              Show style visuals
            </button>
          </span>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="border rounded p-1"
            disabled={!CHILD_BY_PARENT[parentStyle]}
          >
            {(CHILD_BY_PARENT[parentStyle] || []).map(s => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 md:grid-cols-12 gap-3 text-sm items-end">
        <label className="flex flex-col">
          <span>Internal Length (L, mm)</span>
          <input type="number" value={L} onChange={(e) => setL(+e.target.value)} className="border rounded p-1" />
        </label>
        <label className="flex flex-col">
          <span>Internal Width (W, mm)</span>
          <input type="number" value={W} onChange={(e) => setW(+e.target.value)} className="border rounded p-1" />
        </label>
        <label className="flex flex-col">
          <span>Internal Height (H, mm)</span>
          <input type="number" value={H} onChange={(e) => setH(+e.target.value)} className="border rounded p-1" />
        </label>

        <label className="flex flex-col">
          <span>Flute</span>
          <select value={flute} onChange={(e) => setFlute(e.target.value)} className="border rounded p-1">
            {fluteTable.map((f) => (
              <option key={f.flute} value={f.flute}>{f.flute} ({f.thickness} mm)</option>
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
          <input type="number" value={glue} onChange={(e) => setGlue(+e.target.value)} className="border rounded p-1" />
        </label>
        <label className="flex flex-col">
          <span>Glue lap extension a (mm)</span>
          <input
            type="number"
            step="0.5"
            value={glueExt}
            onChange={(e) => setGlueExt(Math.max(0, +e.target.value))}
            className="border rounded p-1"
          />
        </label>
        <label className="flex flex-col">
          <span>Bevel angle (° from horizontal)</span>
          <input type="number" step="0.5" value={bevelDeg} onChange={(e) => setBevelDeg(+e.target.value)} className="border rounded p-1" />
        </label>

        {/* SHOW/HIDE CHECKBOXES (the “missing tick boxes”) */}
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showDims} onChange={(e) => setShowDims(e.target.checked)} />
          <span>Show dimensions</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showFormulas} onChange={(e) => setShowFormulas(e.target.checked)} />
          <span>Show panel formulas</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
          <span>Show labels</span>
        </label>

        {/* Flap locks – forced ON for 0201 */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isRSC0201 ? true : lockTop}
            onChange={(e) => !isRSC0201 && setLockTop(e.target.checked)}
            disabled={isRSC0201}
          />
          <span>Lock top panel heights</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isRSC0201 ? true : lockBottom}
            onChange={(e) => !isRSC0201 && setLockBottom(e.target.checked)}
            disabled={isRSC0201}
          />
          <span>Lock bottom panel heights</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isRSC0201 ? true : lockSymmetry}
            onChange={(e) => !isRSC0201 && setLockSymmetry(e.target.checked)}
            disabled={isRSC0201}
          />
          <span>Lock top & bottom (symmetry)</span>
        </label>

        {/* slots */}
        <label className="flex flex-col">
          <span>Slot width (mm)</span>
          <input type="number" step="0.5" value={slotWidth} onChange={(e) => setSlotWidth(+e.target.value)} className="border rounded p-1" />
        </label>

        {/* flap gaps */}
        <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="flex flex-col">
            <span>Flap gap (Top Inner)</span>
            <input type="number" step="0.5" value={gapTopInner} onChange={(e)=>{lastEdit.current="ti";setGapTopInner(+e.target.value);}} className="border rounded p-1" />
          </label>
          <label className="flex flex-col">
            <span>Flap gap (Top Outer)</span>
            <input type="number" step="0.5" value={gapTopOuter} onChange={(e)=>{lastEdit.current="to";setGapTopOuter(+e.target.value);}} className="border rounded p-1" />
          </label>
          <label className="flex flex-col">
            <span>Flap gap (Bottom Inner)</span>
            <input type="number" step="0.5" value={gapBotInner} onChange={(e)=>{lastEdit.current="bi";setGapBotInner(+e.target.value);}} className="border rounded p-1" />
          </label>
          <label className="flex flex-col">
            <span>Flap gap (Bottom Outer)</span>
            <input type="number" step="0.5" value={gapBotOuter} onChange={(e)=>{lastEdit.current="bo";setGapBotOuter(+e.target.value);}} className="border rounded p-1" />
          </label>
        </div>
      </div>

      {/* Spec line */}
      <div className="text-sm font-mono">
        {`FEFCO ${style || parentStyle} — internal L=${L} W=${W} H=${H} | flute=${flute} t=${t} | glue=${g.glue} | glueSide=${glueSide} | glueOff=${glueOff} | adds P1=${panelAdds.p1||0} P2=${panelAdds.p2||0} P3=${panelAdds.p3||0} P4=${panelAdds.p4||0} | a=${glueExt} | angle=${bevelDeg}° | S2S = H + H1 → ${g.s2s} mm | sheet=${g.totalWidth}×${g.totalHeight} mm`}
      </div>

      {/* Folded Flat summary */}
      <div className="border rounded-md p-3">
        <div className="font-semibold mb-2">Folded Flat Size</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm font-mono">
          <div><span className="font-semibold">FF Length: </span>{fmt(ffLength)}</div>
          <div><span className="font-semibold">FF Width: </span>{fmt(ffWidth)}</div>
          <div><span className="font-semibold">FF Thickness: </span>{fmt(ffThickness)}</div>
        </div>
      </div>

      {/* ====== Expandable sections ====== */}
      <Section title="2D Blank Drawing" openDefault>
        {isRSC0201 ? (
          <div ref={containerRef} className="border rounded-lg bg-white w-full">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH}>
              <defs>
                <marker id="dimArrowGreen" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
                  <path d="M0,0 L5,2.5 L0,5 Z" fill={DIM_COLOR} />
                </marker>
              </defs>

              {/* Left column labels */}
              {showLabels && (
                <>
                  <text x={margins.left - LABEL_COL_W + 8} y={(top + yTopScore) / 2} fontSize={FONT} textAnchor="start">Top Flaps</text>
                  <text x={margins.left - LABEL_COL_W + 8} y={(yTopScore + yBotScore) / 2} fontSize={FONT} textAnchor="start">Body</text>
                  <text x={margins.left - LABEL_COL_W + 8} y={(yBotScore + bottom) / 2} fontSize={FONT} textAnchor="start">Bottom Flaps</text>
                </>
              )}

              {/* LEFT – short vertical between chamfers (only if needed) */}
              {yChamferBotLeft > yChamferTopLeft && (
                <line x1={left} y1={yChamferTopLeft} x2={left} y2={yChamferBotLeft} stroke="black" strokeWidth="1.5" />
              )}

              {/* Glue-lap chamfers to START of glue slot */}
              <line x1={x0 - (glueSlot ? (swPx / 2) : 0)} y1={yTopSlot} x2={left} y2={yChamferTopLeft} stroke="black" strokeWidth="1.5" />
              <line x1={x0 - (glueSlot ? (swPx / 2) : 0)} y1={yBotSlot} x2={left} y2={yChamferBotLeft} stroke="black" strokeWidth="1.5" />

              {/* BODY vertical score lines */}
              {[x0, x1, x2, x3].map((xx, i) => (
                <line key={`bodyV-${i}`} x1={xx} y1={yTopScore} x2={xx} y2={yBotScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W} />
              ))}

              {/* Global scores */}
              <line x1={left}  y1={yTopScore} x2={right} y2={yTopScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W} />
              <line x1={left}  y1={yBotScore} x2={right} y2={yBotScore} stroke={SCORE_COLOR} strokeWidth={SCORE_W} />

              {/* Cutting-rule paths */}
              <path d={topBoundaryPath} stroke="black" strokeWidth="1.5" fill="none" />
              <path d={botBoundaryPath} stroke="black" strokeWidth="1.5" fill="none" />

              {/* RIGHT OUTER BORDER */}
              <line x1={right} y1={yTopAt(right)} x2={right} y2={yBotAt(right)} stroke="black" strokeWidth="1.5" />

              {/* Top headers – fixed row */}
              {showLabels && (
                [
                  (left + x0) / 2,
                  (x0 + x1) / 2,
                  (x1 + x2) / 2,
                  (x2 + x3) / 2,
                  (x3 + right) / 2,
                ].map((cx, i) => (
                  <text key={`top-label-${i}`} x={cx} y={(margins.top - (showLabels ? 0 : HEADER_ROW_H)) + 10} fontSize={FONT} textAnchor="middle">
                    {["Glue Lap", "Panel 1", "Panel 2", "Panel 3", "Panel 4"][i]}
                  </text>
                ))
              )}

              {/* ===== Dimensions (optional) ===== */}
              {showDims && (
                <>
                  {/* overall height – inside left label column */}
                  <line x1={overallDimX} y1={Math.min(...topEdge)} x2={left} y2={Math.min(...topEdge)} stroke={DIM_COLOR} strokeWidth="1" />
                  <line x1={overallDimX} y1={Math.max(...botEdge)} x2={left} y2={Math.max(...botEdge)} stroke={DIM_COLOR} strokeWidth="1" />
                  {(() => {
                    const overallHeightMM = (Math.max(...botEdge) - Math.min(...topEdge)) / s;
                    return (
                      <VDim
                        x={overallDimX}
                        y1={Math.min(...topEdge)}
                        y2={Math.max(...botEdge)}
                        head={fmt(overallHeightMM)}
                        lines={[]}
                        side={+1}
                      />
                    );
                  })()}

                  {/* S2S (H + H1) on right */}
                  <line x1={right + 40} y1={yTopScore} x2={right} y2={yTopScore} stroke={DIM_COLOR} strokeWidth="1" />
                  <line x1={right + 40} y1={yBotScore} x2={right} y2={yBotScore} stroke={DIM_COLOR} strokeWidth="1" />
                  <VDim
                    x={right + 40}
                    y1={yTopScore}
                    y2={yBotScore}
                    head={fmt(g.s2s)}
                    lines={showFormulas ? ["Int H + H1", `${Math.round(H)} + ${Math.round(rscH1)}`] : []}
                    side={-1}
                  />

                  {/* TOP: overall sheet length */}
                  <line
                    x1={left}
                    y1={sheetTopY}
                    x2={right}
                    y2={sheetTopY}
                    stroke={DIM_COLOR}
                    strokeWidth="1"
                    markerStart="url(#dimArrowGreen)"
                    markerEnd="url(#dimArrowGreen)"
                  />
                  <PlateText x={(left + right) / 2} y={sheetTopY - 12} head={fmt(g.totalWidth)} lines={[]} color={DIM_COLOR} />

                  {/* BOTTOM: panel widths */}
                  {[0,1,2,3].map((idx) => {
                    const xStart = panelStarts[idx];
                    const xEnd   = panelEnds[idx];
                    const xMid   = (xStart + xEnd) / 2;

                    return (
                      <React.Fragment key={`pw-${idx}`}>
                        {dimTick(xStart, panelDimY)}
                        {dimTick(xEnd,   panelDimY)}
                        <line
                          x1={xStart}
                          y1={panelDimY}
                          x2={xEnd}
                          y2={panelDimY}
                          stroke={DIM_COLOR}
                          strokeWidth="1"
                          markerStart="url(#dimArrowGreen)"
                          markerEnd="url(#dimArrowGreen)"
                        />
                        <PlateText
                          x={xMid}
                          y={panelDimY + 12}
                          head={fmt(g.panels[idx])}
                          lines={showFormulas ? [panelFormulaName(idx+1), panelFormulaCalc(idx+1)] : []}
                          color={DIM_COLOR}
                        />
                      </React.Fragment>
                    );
                  })}

                  {/* Glue lap width */}
                  {(() => {
                    const glueDimY = panelDimY + 22;
                    const mid = (left + x0) / 2;
                    return (
                      <>
                        {dimTick(left, glueDimY)}
                        {dimTick(x0,   glueDimY)}
                        <line
                          x1={left}
                          y1={glueDimY}
                          x2={x0}
                          y2={glueDimY}
                          stroke={DIM_COLOR}
                          strokeWidth="1"
                          markerStart="url(#dimArrowGreen)"
                          markerEnd="url(#dimArrowGreen)"
                        />
                        <PlateText x={mid} y={glueDimY + 12} head={fmt(g.glue)} />
                      </>
                    );
                  })()}

                  {/* Flap heights — values + formulas */}
                  <VDim
                    x={(x1 + x2)/2}
                    y1={topEdge[1]}
                    y2={yTopScore}
                    head={fmt(topHOuterDisp)}
                    lines={showFormulas ? ["(Int W ÷ 2) + Flap allowance − (Top Outer gap ÷ 2)", `(${Math.round(W)} ÷ 2) + ${Math.round(rscFlap)} − (${Math.round(gapTopOuter)} ÷ 2)`] : []}
                    side={+1}
                  />
                  <VDim
                    x={(x2 + x3)/2}
                    y1={topEdge[2]}
                    y2={yTopScore}
                    head={fmt(topHInnerDisp)}
                    lines={showFormulas ? ["(Int L ÷ 2) + Flap allowance − (Top Inner gap ÷ 2)", `(${Math.round(L)} ÷ 2) + ${Math.round(rscFlap)} − (${Math.round(gapTopInner)} ÷ 2)`] : []}
                    side={+1}
                  />
                  <VDim
                    x={(x1 + x2)/2}
                    y1={yBotScore}
                    y2={botEdge[1]}
                    head={fmt(botHOuterDisp)}
                    lines={showFormulas ? ["(Int W ÷ 2) + Flap allowance − (Bottom Outer gap ÷ 2)", `(${Math.round(W)} ÷ 2) + ${Math.round(rscFlap)} − (${Math.round(gapBotOuter)} ÷ 2)`] : []}
                    side={-1}
                  />
                  <VDim
                    x={(x2 + x3)/2}
                    y1={yBotScore}
                    y2={botEdge[2]}
                    head={fmt(botHInnerDisp)}
                    lines={showFormulas ? ["(Int L ÷ 2) + Flap allowance − (Bottom Inner gap ÷ 2)", `(${Math.round(L)} ÷ 2) + ${Math.round(rscFlap)} − (${Math.round(gapBotInner)} ÷ 2)`] : []}
                    side={-1}
                  />
                </>
              )}
            </svg>
          </div>
        ) : (
          <div className="p-4 text-sm text-gray-700 border rounded bg-gray-50">
            Style <span className="font-mono">{style || parentStyle}</span> selected.
            Rendering is currently implemented for <span className="font-mono">0201 – RSC</span> only.
          </div>
        )}
      </Section>

      {/* Other sections (placeholders) */}
      <Section title="Manufacturing Drawing"><div className="text-sm text-gray-600">No content yet.</div></Section>
      <Section title="Folded Flat Image"><div className="text-sm text-gray-600">No content yet.</div></Section>
      <Section title="3D Folded Image"><div className="text-sm text-gray-600">No content yet.</div></Section>
      <Section title="Palletisation - Supplied Product">
  <PalletisationPanel ffLength={ffLength} ffWidth={ffWidth} />
</Section>

      <Section title="Truck Utilisation - Supplied Product"><div className="text-sm text-gray-600">No content yet.</div></Section>
      <Section title="Machine Suitability"><div className="text-sm text-gray-600">No content yet.</div></Section>
      <Section title="Palletisation - Customer Product"><div className="text-sm text-gray-600">No content yet.</div></Section>
      <Section title="Safety Factor"><div className="text-sm text-gray-600">No content yet.</div></Section>
      <Section title="Quality Tolerances"><div className="text-sm text-gray-600">No content yet.</div></Section>
      <Section title="Technical Specifications"><div className="text-sm text-gray-600">No content yet.</div></Section>
      <Section title="Downloads and Reports"><div className="text-sm text-gray-600">No content yet.</div></Section>

      {/* ===== Style Visuals Modal ===== */}
      {showStyleGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowStyleGallery(false)} />
          <div className="relative bg-white rounded-lg shadow-xl p-4 w-full max-w-4xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">FEFCO 020x styles</h3>
              <button className="text-gray-600 hover:text-black" onClick={() => setShowStyleGallery(false)}>✕</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {STYLE_VISUALS.map(({ code, name }) => (
                <button
                  key={code}
                  onClick={() => { setParentStyle("0200"); setStyle(code); setShowStyleGallery(false); }}
                  className={`border rounded-md p-2 hover:shadow ${style === code ? "ring-2 ring-blue-500" : ""}`}
                >
                  {/* Uniform 4:3 cell; image scales and never overflows */}
                  <div className="relative w-full pb-[75%] bg-gray-50 rounded overflow-hidden">
                    <img
                      src={`/fefco/${code}.png`}
                      alt={name}
                      className="absolute inset-0 w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-2 text-center text-sm font-mono">{code}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
