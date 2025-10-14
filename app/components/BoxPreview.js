// app/components/BoxPreview.js
"use client";

import { useMemo, useRef, useState, useEffect } from "react";

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

// Across-web panel order for 02xx blanks: [glue, W, L, W, L]
function baseBodyWidth(W, L, glueTab) {
  return glueTab + W + L + W + L;
}

const GLUE_TAB_DEFAULT = 12; // mm
const mm = (x) => (Number.isFinite(x) ? x : 0);

/* ---------------- per-style geometry ---------------- */

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

// 0201 — Regular Slotted Carton: flaps meet in the middle along WIDTH
function compute0201(L, W, H) {
  const flap = Math.round(W / 2);
  return mkModel("0201", L, W, H, flap, flap, "0201 RSC: top/bottom flaps ≈ W/2");
}

// 0200 — Half Slotted: top open (0), bottom like 0201
function compute0200(L, W, H) {
  const topFlap = 0;
  const bottomFlap = Math.round(W / 2);
  return mkModel("0200", L, W, H, topFlap, bottomFlap, "0200 HSC: top flaps = 0, bottom ≈ W/2");
}

// 0202 — Overlap Slotted Carton: partial overlap along WIDTH
function compute0202(L, W, H) {
  const flap = Math.round(W * 0.75);
  return mkModel("0202", L, W, H, flap, flap, "0202 OSC: top/bottom flaps ≈ 0.75·W");
}

// 0203 — Full Overlap along WIDTH
function compute0203(L, W, H) {
  const flap = W; // full overlap
  return mkModel("0203", L, W, H, flap, flap, "0203 FOL: top/bottom flaps ≈ W (full overlap)");
}

/* === length-based center-special variants (requested) === */

// 0204 — CSSC: flaps meet at center along LENGTH (not width)
function compute0204(L, W, H) {
  const flap = Math.round(L / 2);
  return mkModel(
    "0204",
    L, W, H,
    flap, flap,
    "0204 CSSC: top/bottom flaps ≈ L/2 (center-special along length)"
  );
}

// 0205 — Center-Special Overlap: flaps overlap along LENGTH
// Default partial overlap 0.75·L; change to L for full overlap if needed.
function compute0205(L, W, H) {
  const flap = Math.round(L * 0.75);
  // const flap = L; // <- use this for full overlap along length
  return mkModel(
    "0205",
    L, W, H,
    flap, flap,
    "0205 CS-Overlap: top/bottom flaps ≈ 0.75·L (overlap along length)"
  );
}

// 0206 — Half-Slotted Center-Special: one side open, other is L/2 center-special
function compute0206(L, W, H) {
  const topFlap = Math.round(L / 2);
  const bottomFlap = 0;
  return mkModel(
    "0206",
    L, W, H,
    topFlap, bottomFlap,
    "0206 HSC-CSSC: top ≈ L/2, bottom = 0 (open)"
  );
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

/* ---------------- dimension helpers (SVG) ---------------- */

function DimX({ x1, x2, y, label }) {
  const t = 3; // tick size
  return (
    <g fontSize="6" fill="#333" stroke="#333" strokeWidth="0.4">
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1} y1={y - t} x2={x1} y2={y + t} />
      <line x1={x2} y1={y - t} x2={x2} y2={y + t} />
      <text x={(x1 + x2) / 2} y={y - 2} textAnchor="middle">{label}</text>
    </g>
  );
}

function DimY({ y1, y2, x, label }) {
  const t = 3;
  return (
    <g fontSize="6" fill="#333" stroke="#333" strokeWidth="0.4">
      <line x1={x} y1={y1} x2={x} y2={y2} />
      <line x1={x - t} y1={y1} x2={x + t} y2={y1} />
      <line x1={x - t} y1={y2} x2={x + t} y2={y2} />
      <text x={x + 2} y={(y1 + y2) / 2} writingMode="tb">{label}</text>
    </g>
  );
}

/* ---------------- export (SVG->PNG) ---------------- */

async function svgToPng(svgEl, filename = "box-blank.png") {
  const serializer = new XMLSerializer();
  const src = serializer.serializeToString(svgEl);
  const blob = new Blob([src], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.src = url;
  await new Promise((res) => { img.onload = res; });

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  canvas.toBlob((pngBlob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(pngBlob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    URL.revokeObjectURL(url);
  });
}

/* ---------------- main component ---------------- */

export default function BoxPreview({ initial, style }) {
  const [dims, setDims] = useState(() => ({
    L: initial?.L ?? 267,
    W: initial?.W ?? 120,
    H: initial?.H ?? 80,
    t: initial?.t ?? 3, // not used in this schematic math
    style: initial?.style ?? "0201",
  }));

  // If parent passes a style (e.g., from your modal), sync it
  useEffect(() => {
    if (style && style !== dims.style) setDims((d) => ({ ...d, style }));
  }, [style]); // eslint-disable-line react-hooks/exhaustive-deps

  const model = useMemo(
    () => computeModel(dims.style, mm(dims.L), mm(dims.W), mm(dims.H)),
    [dims.style, dims.L, dims.W, dims.H]
  );

  const vb = useMemo(() => ViewboxFor(model.bodyWidth, model.totalHeight), [model]);
  const scaleX = 900 / vb.width; // try to fit ~900px width
  const heightPx = Math.round(vb.height * scaleX);

  const svgRef = useRef(null);

  // Vertical panel X positions for dimension labels
  const panelX = useMemo(() => {
    const xs = [0];
    let x = 0;
    for (const w of model.panels) { x += w; xs.push(x); }
    return xs; // 6 entries: start..end
  }, [model]);

  const { topFlap, body, bottomFlap } = model.panelHeights;
  const bodyTopY = bottomFlap;
  const bodyBotY = bottomFlap + body;

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
            <option value="0204">0204 (CSSC)</option>
            <option value="0205">0205 (CS-Overlap)</option>
            <option value="0206">0206 (HSC-CSSC)</option>
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

        <button
          className="ml-auto px-3 py-1 border rounded hover:bg-gray-50"
          onClick={() => svgToPng(svgRef.current, `FEFCO-${model.name}.png`)}
          title="Export current drawing to PNG"
        >
          Download PNG
        </button>
      </div>

      {/* Renderer */}
      <div className="rounded border bg-white overflow-auto">
        <svg
          ref={svgRef}
          width="100%"
          height={heightPx}
          viewBox={`0 0 ${vb.width} ${vb.height}`}
        >
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
              x1="0" y1={bottomFlap} x2={model.bodyWidth} y2={bottomFlap}
              stroke="#666" strokeDasharray="4 4" strokeWidth="0.6"
            />
            <line
              x1="0" y1={bodyBotY} x2={model.bodyWidth} y2={bodyBotY}
              stroke="#666" strokeDasharray="4 4" strokeWidth="0.6"
            />

            {/* vertical creases between panels */}
            {(() => {
              const lines = [];
              let x = model.panels[0]; // first crease (after glue tab)
              for (let i = 1; i < model.panels.length; i++) {
                lines.push(
                  <line
                    key={`v-${i}`}
                    x1={x} y1="0" x2={x} y2={model.totalHeight}
                    stroke="#666" strokeDasharray="4 4" strokeWidth="0.6"
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

            {/* --- dimension annotations --- */}
            {/* overall width */}
            <DimX x1={0} x2={model.bodyWidth} y={-12} label={`FF width ${model.bodyWidth} mm`} />
            {/* overall height */}
            <DimY x={-12} y1={0} y2={model.totalHeight} label={`FF height ${model.totalHeight} mm`} />

            {/* panel widths: glue, W, L, W, L */}
            {model.panels.map((pw, i) => {
              const x1 = panelX[i];
              const x2 = panelX[i + 1];
              const title =
                i === 0 ? `Glue ${pw} mm`
                : i === 1 || i === 3 ? `W ${pw} mm`
                : `L ${pw} mm`;
              return (
                <DimX
                  key={`pdim-${i}`}
                  x1={x1}
                  x2={x2}
                  y={model.totalHeight + 14 + (i % 2) * 7}
                  label={title}
                />
              );
            })}

            {/* flap heights */}
            {bottomFlap > 0 && (
              <DimY x={model.bodyWidth + 12} y1={0} y2={bottomFlap} label={`Bottom flap ${bottomFlap} mm`} />
            )}
            {topFlap > 0 && (
              <DimY x={model.bodyWidth + 12} y1={bodyBotY} y2={model.totalHeight} label={`Top flap ${topFlap} mm`} />
            )}
            {/* body height */}
            <DimY x={model.bodyWidth + 24} y1={bodyTopY} y2={bodyBotY} label={`Body ${body} mm`} />
          </g>
        </svg>
      </div>
    </div>
  );
}
