// app/components/BoxPreview.js
"use client";

import { useMemo, useState, useEffect } from "react";

/* ---------------- helpers ---------------- */

function ViewboxFor(mmWidth, mmHeight) {
  const margin = 20; // mm around the sheet
  return {
    width: mmWidth + margin * 2,
    height: mmHeight + margin * 2,
    originX: margin,
    originY: margin,
  };
}

// Across-web panel order for 02xx: [glue, W, L, W, L]
function baseBodyWidth(W, L, glueTab) {
  return glueTab + W + L + W + L;
}

const GLUE_TAB_DEFAULT = 12; // mm, simple baseline

/* ---------------- per-style geometry (stable & simple) ---------------- */
/**
 * NOTE on simplifications:
 * - These are schematic blanks for fast iteration.
 * - 0200/0201/0202/0203 use distinct flap heights.
 * - 0204/0205/0206 are currently 0201-like placeholders (creases & panel order the same).
 *   When you're ready, give me your exact flap/slot rules and I'll implement them precisely.
 */

function mkModel(name, L, W, H, topFlap, bottomFlap, label) {
  const glueTab = GLUE_TAB_DEFAULT;
  const body = H;
  const total = topFlap + body + bottomFlap;
  return {
    name,
    glueTab,
    panels: [glueTab, W, L, W, L],
    panelHeights: { topFlap, body, bottomFlap },
    bodyWidth: baseBodyWidth(W, L, glueTab),
    totalHeight: total,
    label,
  };
}

function compute0201(L, W, H) {
  const flap = Math.round(W / 2); // meet in middle
  return mkModel("0201", L, W, H, flap, flap, "RSC: top/bottom flaps ≈ W/2");
}

function compute0200(L, W, H) {
  // Half slotted (top open; bottoms like 0201). Common simplification.
  const topFlap = 0;
  const bottomFlap = Math.round(W / 2);
  return mkModel("0200", L, W, H, topFlap, bottomFlap, "HSC: top flaps = 0, bottom ≈ W/2");
}

function compute0202(L, W, H) {
  const flap = Math.round(W * 0.75); // partial overlap
  return mkModel("0202", L, W, H, flap, flap, "OSC: top/bottom flaps ≈ 0.75·W");
}

function compute0203(L, W, H) {
  const flap = W; // full overlap
  return mkModel("0203", L, W, H, flap, flap, "FOL: top/bottom flaps ≈ W (full overlap)");
}

// Placeholders: use 0201 geometry for now (creases & layout okay, flap scheme TBD)
function compute0204(L, W, H) {
  const m = compute0201(L, W, H);
  return { ...m, name: "0204", label: "0204: schematic placeholder (0201-like flaps)" };
}
function compute0205(L, W, H) {
  const m = compute0201(L, W, H);
  return { ...m, name: "0205", label: "0205: schematic placeholder (0201-like flaps)" };
}
function compute0206(L, W, H) {
  const m = compute0201(L, W, H);
  return { ...m, name: "0206", label: "0206: schematic placeholder (0201-like flaps)" };
}

function computeModel(style, L, W, H) {
  switch (style) {
    case "0200": return compute0200(L, W, H);
    case "0201": return compute0201(L, W, H);
    case "0202": return compute0202(L, W, H);
    case "0203": return compute0203(L, W, H);
    case "0204": return compute0204(L, W, H);
    case "0205": return compute0205(L, W, H);
    case "0206": return compute0206(L, W, H);
    default:     return compute0201(L, W, H);
  }
}

/* ---------------- main component ---------------- */

export default function BoxPreview({ initial, style }) {
  const [dims, setDims] = useState(() => ({
    L: initial?.L ?? 267,
    W: initial?.W ?? 120,
    H: initial?.H ?? 80,
    t: initial?.t ?? 3,     // not used in schematic math yet
    style: initial?.style ?? "0201",
  }));

  // If parent passes a style (e.g., from your modal), sync it
  useEffect(() => {
    if (style && style !== dims.style) setDims(d => ({ ...d, style }));
  }, [style]); // eslint-disable-line react-hooks/exhaustive-deps

  const model = useMemo(
    () => computeModel(dims.style, dims.L, dims.W, dims.H),
    [dims.style, dims.L, dims.W, dims.H]
  );

  const vb = useMemo(() => ViewboxFor(model.bodyWidth, model.totalHeight), [model]);
  const scaleX = 900 / vb.width; // try to fit ~900px width
  const heightPx = Math.round(vb.height * scaleX);

  return (
    <div>
      {/* Controls */}
      <div className="flex gap-2 flex-wrap items-end mb-3 text-sm">
        <label className="flex flex-col">
          <span className="opacity-70">Style</span>
          <select
            value={dims.style}
            onChange={(e) => setDims({ ...dims, style: e.target.value })}
            className="border rounded px-2 py-1"
          >
            <option value="0200">0200 (HSC)</option>
            <option value="0201">0201 (RSC)</option>
            <option value="0202">0202 (OSC)</option>
            <option value="0203">0203 (FOL)</option>
            <option value="0204">0204 (CSSC)*</option>
            <option value="0205">0205*</option>
            <option value="0206">0206*</option>
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

      {/* Renderer */}
      <div className="rounded border bg-white overflow-auto">
        <svg width="100%" height={heightPx} viewBox={`0 0 ${vb.width} ${vb.height}`}>
          {/* sheet outline */}
          <rect x="0" y="0" width={vb.width} height={vb.height} fill="#fff" stroke="#eee" />
          <g transform={`translate(${vb.originX}, ${vb.originY})`}>
            {/* body rectangle */}
            <rect
              x="0" y="0"
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
              let x = model.panels[0]; // first crease (after glue tab)
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
              {model.label}{model.name >= "0204" ? "  •  *schematic*" : ""}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
