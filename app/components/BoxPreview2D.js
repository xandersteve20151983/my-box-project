"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/* ---------- Safe defaults ---------- */
const num = (v, d) =>
  v === undefined || v === null || v === "" || Number.isNaN(+v) ? d : +v;

const DEFAULTS = {
  L: 284,
  W: 200,
  D: 150,
  fluteThickness: 3,
  glueWidth: 35,
  aExt: 76,
  bevelAngle: 30,
  p1: 0,
  p2: 0,
  p3: 0,
  p4: 0,
  gapInner: 4,
  gapOuter: 4,
  slotWidth: 6,
};

/* ---------- Simple 2D renderer (SVG) ---------- */
export default function BoxPreview2D(props) {
  // If you later pass real inputs via props or a store, this stays safe.
  const inputs = props?.inputs ?? {};
  const L = num(inputs.L, DEFAULTS.L);
  const W = num(inputs.W, DEFAULTS.W);
  const D = num(inputs.D, DEFAULTS.D);
  const glue = num(inputs.glueWidth, DEFAULTS.glueWidth);
  const slot = num(inputs.slotWidth, DEFAULTS.slotWidth);

  // Measure container so we scale-to-fit
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ w: 900, h: 420 });
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({
        w: Math.max(300, r.width),
        h: Math.max(340, r.height),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Geometry for a minimal FEFCO 0201 blank: glue + L + W + L + W
  const panelHeights = useMemo(() => {
    // make a little top/bottom flap: ~0.65*D for illustration
    const flap = Math.max(24, Math.round(D * 0.65));
    return { top: flap, body: D, bot: flap };
  }, [D]);

  const totalW_mm = glue + L + W + L + W;
  const totalH_mm = panelHeights.top + panelHeights.body + panelHeights.bot;

  // Fit into viewport with padding
  const PAD = 24;
  const viewW = Math.max(200, size.w - PAD * 2);
  const viewH = Math.max(200, size.h - PAD * 2);
  const scale = Math.min(viewW / totalW_mm, viewH / totalH_mm);

  // X positions of vertical scores
  const x0 = 0;
  const x1 = x0 + glue;
  const x2 = x1 + L;
  const x3 = x2 + W;
  const x4 = x3 + L;
  const x5 = x4 + W;

  // Y positions
  const y0 = 0;
  const y1 = y0 + panelHeights.top;
  const y2 = y1 + panelHeights.body;
  const y3 = y2 + panelHeights.bot;

  // Stroke styles
  const CUT = "#000";
  const SCORE = "#c62828";
  const DIM = "#2e7d32";

  return (
    <div ref={wrapRef} className="w-full h-full">
      <svg
        width="100%"
        height="100%"
        viewBox={`${-PAD} ${-PAD} ${viewW + PAD * 2} ${viewH + PAD * 2}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <g transform={`translate(${PAD},${PAD}) scale(${scale})`}>
          {/* Outline (cut) */}
          <rect
            x={x0}
            y={y0}
            width={totalW_mm}
            height={totalH_mm}
            fill="none"
            stroke={CUT}
            strokeWidth={1 / scale}
          />

          {/* Panel body rectangle to make it obvious */}
          <rect
            x={x1}
            y={y1}
            width={L + W + L + W}
            height={panelHeights.body}
            fill="none"
            stroke={CUT}
            strokeWidth={1 / scale}
          />

          {/* Vertical scores */}
          {[x1, x2, x3, x4].map((x, i) => (
            <line
              key={`vs-${i}`}
              x1={x}
              y1={y0}
              x2={x}
              y2={y3}
              stroke={SCORE}
              strokeWidth={1 / scale}
            />
          ))}

          {/* Horizontal scores */}
          {[y1, y2].map((y, i) => (
            <line
              key={`hs-${i}`}
              x1={x0}
              y1={y}
              x2={x5}
              y2={y}
              stroke={SCORE}
              strokeWidth={1 / scale}
            />
          ))}

          {/* Simple dimension arrows */}
          {/* L at Panel 1 */}
          <g>
            <line
              x1={x1}
              y1={y2 + 18}
              x2={x2}
              y2={y2 + 18}
              stroke={DIM}
              strokeWidth={1 / scale}
              markerStart="url(#dimStart)"
              markerEnd="url(#dimEnd)"
            />
            <text
              x={(x1 + x2) / 2}
              y={y2 + 32}
              fontSize={14 / scale}
              textAnchor="middle"
              fill={DIM}
            >
              {L} mm
            </text>
          </g>

          {/* W at Panel 2 */}
          <g>
            <line
              x1={x2}
              y1={y2 + 18}
              x2={x3}
              y2={y2 + 18}
              stroke={DIM}
              strokeWidth={1 / scale}
              markerStart="url(#dimStart)"
              markerEnd="url(#dimEnd)"
            />
            <text
              x={(x2 + x3) / 2}
              y={y2 + 32}
              fontSize={14 / scale}
              textAnchor="middle"
              fill={DIM}
            >
              {W} mm
            </text>
          </g>

          {/* Overall width */}
          <g>
            <line
              x1={x0}
              y1={y3 + 30}
              x2={x5}
              y2={y3 + 30}
              stroke={DIM}
              strokeWidth={1 / scale}
              markerStart="url(#dimStart)"
              markerEnd="url(#dimEnd)"
            />
            <text
              x={(x0 + x5) / 2}
              y={y3 + 46}
              fontSize={14 / scale}
              textAnchor="middle"
              fill={DIM}
            >
              {Math.round(totalW_mm)} mm (glue+L+W+L+W)
            </text>
          </g>

          {/* Glue panel label */}
          <text
            x={x0 + glue / 2}
            y={y1 - 6}
            fontSize={14 / scale}
            textAnchor="middle"
            fill="#333"
          >
            Glue {glue} mm
          </text>

          {/* Simple slots (for visibility) */}
          <rect
            x={x2 - slot / 2}
            y={y0}
            width={slot}
            height={panelHeights.top}
            fill="none"
            stroke={CUT}
            strokeDasharray={`${3 / scale} ${3 / scale}`}
            strokeWidth={1 / scale}
          />
          <rect
            x={x4 - slot / 2}
            y={y2}
            width={slot}
            height={panelHeights.bot}
            fill="none"
            stroke={CUT}
            strokeDasharray={`${3 / scale} ${3 / scale}`}
            strokeWidth={1 / scale}
          />
        </g>

        {/* arrow markers */}
        <defs>
          <marker
            id="dimStart"
            markerWidth="6"
            markerHeight="6"
            refX="0"
            refY="3"
            orient="auto"
          >
            <path d="M6 0 L0 3 L6 6" fill="none" stroke={DIM} strokeWidth="1" />
          </marker>
          <marker
            id="dimEnd"
            markerWidth="6"
            markerHeight="6"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0 0 L6 3 L0 6" fill="none" stroke={DIM} strokeWidth="1" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}
