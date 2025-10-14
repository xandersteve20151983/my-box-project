// app/components/BoxPreview.js
"use client";

import { useMemo, useState } from "react";

/**
 * Very small 0201 blank renderer.
 * Geometry is simplified to a teaching/stable baseline:
 * - Panels: [W, L, W, L] with glue tab at the left
 * - Height is used for flap heights (top/bottom)
 * - Board caliper `t` applied minimally (you can layer your old allowances in later)
 * - Everything in millimeters; scaled to fit an SVG viewbox
 */

function mmToPx(mm, scale) {
  return mm * scale;
}

function compute0201(L, W, H, t) {
  // Panel widths (across the sheet): glue tab + W + L + W + L
  const glueTab = Math.max(12, Math.round(6 + t * 2)); // modest glue allowance
  const panels = [glueTab, W, L, W, L];

  const panelHeights = {
    body: H,
    topFlap: Math.round(W / 2),    // very simple model; tweak with your own rules
    bottomFlap: Math.round(W / 2), // ditto
  };

  const bodyHeight = panelHeights.body;
  const totalHeight = panelHeights.bottomFlap + bodyHeight + panelHeights.topFlap;

  const bodyWidth = panels.reduce((a, b) => a + b, 0);

  return {
    glueTab,
    panels,
    panelHeights,
    bodyWidth,
    totalHeight,
  };
}

function ViewboxFor(mmWidth, mmHeight) {
  // Leave a margin around the sheet (in mm)
  const margin = 20;
  return {
    width: mmWidth + margin * 2,
    height: mmHeight + margin * 2,
    originX: margin,
    originY: margin,
  };
}

export default function BoxPreview({ initial }) {
  const [dims, setDims] = useState(() => ({
    L: initial?.L ?? 267,
    W: initial?.W ?? 120,
    H: initial?.H ?? 80,
    t: initial?.t ?? 3,
    style: initial?.style ?? "0201",
  }));

  const model = useMemo(() => {
    if (dims.style !== "0201") return null;
    return compute0201(dims.L, dims.W, dims.H, dims.t);
  }, [dims]);

  // Compute a reasonable SVG scale so it fits nicely
  const vb = useMemo(() => {
    if (!model) return ViewboxFor(400, 300);
    return ViewboxFor(model.bodyWidth, model.totalHeight);
  }, [model]);

  // Try to keep a decent scale to fill ~900px width
  const targetPx = 900;
  const scale = useMemo(() => targetPx / vb.width, [vb.width]);

  return (
    <div>
      {/* Control strip (minimal; your big UI can remain elsewhere) */}
      <div className="flex gap-2 flex-wrap items-end mb-3 text-sm">
        <label className="flex flex-col">
          <span className="opacity-70">Style</span>
          <select
            value={dims.style}
            onChange={(e) => setDims({ ...dims, style: e.target.value })}
            className="border rounded px-2 py-1"
          >
            <option value="0201">0201</option>
            <option value="0200">0200</option>
            <option value="0202">0202</option>
            <option value="0203">0203</option>
            <option value="0204">0204</option>
            <option value="0205">0205</option>
            <option value="0206">0206</option>
          </select>
        </label>

        <label className="flex flex-col">
          <span className="opacity-70">L (mm)</span>
          <input
            type="number"
            value={dims.L}
            onChange={(e) => setDims({ ...dims, L: parseFloat(e.target.value || "0") })}
            className="border rounded px-2 py-1 w-24"
          />
        </label>

        <label className="flex flex-col">
          <span className="opacity-70">W (mm)</span>
          <input
            type="number"
            value={dims.W}
            onChange={(e) => setDims({ ...dims, W: parseFloat(e.target.value || "0") })}
            className="border rounded px-2 py-1 w-24"
          />
        </label>

        <label className="flex flex-col">
          <span className="opacity-70">H (mm)</span>
          <input
            type="number"
            value={dims.H}
            onChange={(e) => setDims({ ...dims, H: parseFloat(e.target.value || "0") })}
            className="border rounded px-2 py-1 w-24"
          />
        </label>

        <label className="flex flex-col">
          <span className="opacity-70">t (mm)</span>
          <input
            type="number"
            step="0.1"
            value={dims.t}
            onChange={(e) => setDims({ ...dims, t: parseFloat(e.target.value || "0") })}
            className="border rounded px-2 py-1 w-24"
          />
        </label>
      </div>

      {/* Renderer */}
      <div className="rounded border bg-white overflow-auto">
        {dims.style === "0201" && model ? (
          <svg
            width="100%"
            height={mmToPx(vb.height, scale)}
            viewBox={`0 0 ${vb.width} ${vb.height}`}
          >
            {/* sheet outline */}
            <rect
              x="0"
              y="0"
              width={vb.width}
              height={vb.height}
              fill="#fff"
              stroke="#eee"
            />
            <g transform={`translate(${vb.originX}, ${vb.originY})`}>
              {/* body outline */}
              <rect
                x="0"
                y="0"
                width={model.bodyWidth}
                height={model.totalHeight}
                fill="#fafafa"
                stroke="#333"
                strokeWidth="0.6"
              />

              {/* Horizontal crease lines */}
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

              {/* Vertical crease lines between panels */}
              {(() => {
                let x = model.panels[0];
                const lines = [];
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
                // glue tab crease (left edge)
                lines.unshift(
                  <line
                    key="v-glue"
                    x1={model.panels[0]}
                    y1="0"
                    x2={model.panels[0]}
                    y2={model.totalHeight}
                    stroke="#666"
                    strokeDasharray="4 4"
                    strokeWidth="0.6"
                  />
                );
                return lines;
              })()}

              {/* Labels */}
              <text x="6" y="-6" fontSize="6" fill="#333">
                FEFCO 0201 • blank
              </text>
              <text x="6" y={model.totalHeight + 10} fontSize="6" fill="#333">
                Panels: [glue, W, L, W, L]  •  H={model.panelHeights.body}  •  flap≈W/2
              </text>
            </g>
          </svg>
        ) : (
          <div className="p-10 text-center text-gray-600">
            Palletisation/2D drawing is only wired for <b>0201</b> in this baseline.
            Choose 0201 above to render a blank. We’ll hook the other styles next.
          </div>
        )}
      </div>
    </div>
  );
}
