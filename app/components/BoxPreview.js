// app/components/BoxPreview.js
"use client";

import { useMemo, useState } from "react";

/** ---------- helpers ---------- */
function ViewboxFor(mmWidth, mmHeight) {
  const margin = 20; // mm
  return {
    width: mmWidth + margin * 2,
    height: mmHeight + margin * 2,
    originX: margin,
    originY: margin,
  };
}

// All 02xx use the same panel order across the web (left→right): glue, W, L, W, L.
function baseBodyWidth(W, L, glueTab) {
  return glueTab + W + L + W + L;
}

/** ---------- per-style geometry (simplified, stable) ---------- */
function compute0201(L, W, H) {
  const glueTab = Math.max(12, 6 + 2 * 1.5); // ~12mm default
  const flap = Math.round(W / 2); // meet in middle
  const body = H;
  const total = flap + body + flap;
  return {
    name: "0201",
    glueTab,
    panels: [glueTab, W, L, W, L],
    panelHeights: { topFlap: flap, body, bottomFlap: flap },
    bodyWidth: baseBodyWidth(W, L, glueTab),
    totalHeight: total,
    label: `Panels: [glue, W, L, W, L]  •  H=${body}  •  flap≈W/2`,
  };
}

function compute0200(L, W, H) {
  // Half slotted: no flaps on the top (as a simple, common variant), bottoms like 0201
  const glueTab = Math.max(12, 6 + 2 * 1.5);
  const topFlap = 0;
  const bottomFlap = Math.round(W / 2);
  const body = H;
  const total = topFlap + body + bottomFlap;
  return {
    name: "0200",
    glueTab,
    panels: [glueTab, W, L, W, L],
    panelHeights: { topFlap, body, bottomFlap },
    bodyWidth: baseBodyWidth(W, L, glueTab),
    totalHeight: total,
    label: `HSC: top flaps 0, bottom flap≈W/2`,
  };
}

function compute0203(L, W, H) {
  // Full overlap: both top/bottom flaps ≈ full W
  const glueTab = Math.max(12, 6 + 2 * 1.5);
  const flap = W; // full overlap
  const body = H;
  const total = flap + body + flap;
  return {
    name: "0203",
    glueTab,
    panels: [glueTab, W, L, W, L],
    panelHeights: { topFlap: flap, body, bottomFlap: flap },
    bodyWidth: baseBodyWidth(W, L, glueTab),
    totalHeight: total,
    label: `FOL: top/bottom flaps≈W (full overlap)`,
  };
}

function computeModel(style, L, W, H) {
  switch (style) {
    case "0200":
      return compute0200(L, W, H);
    case "0203":
      return compute0203(L, W, H);
    case "0201":
    default:
      return compute0201(L, W, H);
  }
}

/** ---------- main component ---------- */
export default function BoxPreview({ initial }) {
  const [dims, setDims] = useState(() => ({
    L: initial?.L ?? 267,
    W: initial?.W ?? 120,
    H: initial?.H ?? 80,
    t: initial?.t ?? 3, // currently not used in simplified math
    style: initial?.style ?? "0201",
  }));

  const model = useMemo(
    () => computeModel(dims.style, dims.L, dims.W, dims.H),
    [dims.style, dims.L, dims.W, dims.H]
  );

  const vb = useMemo(() => ViewboxFor(model.bodyWidth, model.totalHeight), [model]);
  // Try to fit about 900px width
  const scaleX = 900 / vb.width;
  const heightPx = Math.round(vb.height * scaleX);

  return (
    <div>
      {/* small control strip */}
      <div className="flex gap-2 flex-wrap items-end mb-3 text-sm">
        <label className="flex flex-col">
          <span className="opacity-70">Style</span>
          <select
            value={dims.style}
            onChange={(e) => setDims({ ...dims, style: e.target.value })}
            className="border rounded px-2 py-1"
          >
            <option value="0201">0201 (RSC)</option>
            <option value="0200">0200 (HSC)</option>
            <option value="0203">0203 (FOL)</option>
          </select>
        </label>

        {["L", "W", "H", "t"].map((k) => (
          <label key={k} className="flex flex-col">
            <span className="opacity-70">{k} (mm)</span>
            <input
              type="number"
              step={k === "t" ? "0.1" : "1"}
              value={dims[k]}
              onChange={(e) => setDims({ ...dims, [k]: parseFloat(e.target.value || "0") })}
              className="border rounded px-2 py-1 w-24"
            />
          </label>
        ))}
      </div>

      {/* renderer */}
      <div className="rounded border bg-white overflow-auto">
        <svg width="100%" height={heightPx} viewBox={`0 0 ${vb.width} ${vb.height}`}>
          {/* sheet outline */}
          <rect x="0" y="0" width={vb.width} height={vb.height} fill="#fff" stroke="#eee" />
          <g transform={`translate(${vb.originX}, ${vb.originY})`}>
            {/* body rectangle */}
            <rect
              x="0"
              y="0"
              width={model.bodyWidth}
              height={model.totalHeight}
              fill="#fafafa"
              stroke="#333"
              strokeWidth="0.6"
            />

            {/* horizontal creases */}
            <line
              x1="0"
              y1={model.panelHeights.bottomFlap}
              x2={model.bodyWidth}
              y2={model.panelHeights.bottomFlap}
              stroke="#666"
              strokeDasharray="4 4"
              strokeWidth="0.6"
            />
            <line
              x1="0"
              y1={model.panelHeights.bottomFlap + model.panelHeights.body}
              x2={model.bodyWidth}
              y2={model.panelHeights.bottomFlap + model.panelHeights.body}
              stroke="#666"
              strokeDasharray="4 4"
              strokeWidth="0.6"
            />

            {/* vertical creases between panels */}
            {(() => {
              const lines = [];
              let x = model.panels[0]; // first crease after glue tab
              for (let i = 1; i < model.panels.length; i++) {
                lines.push(
                  <line
                    key={`v-${i}`}
                    x1={x}
                    y1="0"
                    x2={x}
                    y2={model.totalHeight}
                    stroke="#666"
                    strokeDasharray="4 4"
                    strokeWidth="0.6"
                  />
                );
                x += model.panels[i];
              }
              return lines;
            })()}

            {/* labels */}
            <text x="6" y="-6" fontSize="6" fill="#333">
              FEFCO {model.name} • blank
            </text>
            <text x="6" y={model.totalHeight + 10} fontSize="6" fill="#333">
              {model.label}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
