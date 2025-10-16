// app/page.js
"use client";

import { useState } from "react";
import BoxPreview2D from "./components/BoxPreview2D";

export default function Page() {
  // --- 10 inputs (left column) ---
  const [L, setL] = useState(300);
  const [W, setW] = useState(200);
  const [D, setD] = useState(150); // depth (height)

  const [fluteThickness, setFluteThickness] = useState(4); // mm

  const [gluePosition, setGluePosition] = useState("inside"); // "inside" | "outside"
  const [glueLapOff, setGlueLapOff] = useState("small");       // "small" (W) | "large" (L)

  const [glueLapWidth, setGlueLapWidth] = useState(28);  // mm
  const [glueLapExtension, setGlueLapExtension] = useState(14); // mm (a)
  const [bevelAngle, setBevelAngle] = useState(30); // degrees

  const [slotWidth, setSlotWidth] = useState(6); // mm

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Inputs (exactly the 10 you highlighted) */}
      <div className="lg:col-span-4 space-y-8">
        <section>
          <h2 className="font-semibold mb-2">Internal Dimensions (mm)</h2>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col text-sm">
              <span>L</span>
              <input type="number" value={L} onChange={(e)=>setL(+e.target.value)} className="border rounded p-2" />
            </label>
            <label className="flex flex-col text-sm">
              <span>W</span>
              <input type="number" value={W} onChange={(e)=>setW(+e.target.value)} className="border rounded p-2" />
            </label>
            <label className="flex flex-col text-sm">
              <span>D</span>
              <input type="number" value={D} onChange={(e)=>setD(+e.target.value)} className="border rounded p-2" />
            </label>
          </div>
        </section>

        <section>
          <h2 className="font-semibold mb-2">Allowances &amp; Material</h2>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col text-sm col-span-3 sm:col-span-1">
              <span>Flute thickness</span>
              <input
                type="number"
                step="0.5"
                value={fluteThickness}
                onChange={(e)=>setFluteThickness(+e.target.value)}
                className="border rounded p-2"
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className="font-semibold mb-2">Glue-lap Geometry</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col text-sm">
              <span>Glue position</span>
              <select
                value={gluePosition}
                onChange={(e)=>setGluePosition(e.target.value)}
                className="border rounded p-2"
              >
                <option value="inside">Inside glue</option>
                <option value="outside">Outside glue</option>
              </select>
            </label>

            <label className="flex flex-col text-sm">
              <span>Glue lap off</span>
              <select
                value={glueLapOff}
                onChange={(e)=>setGlueLapOff(e.target.value)}
                className="border rounded p-2"
              >
                <option value="small">Small panel (W)</option>
                <option value="large">Large panel (L)</option>
              </select>
            </label>

            <label className="flex flex-col text-sm">
              <span>Glue-lap width (mm)</span>
              <input
                type="number"
                step="0.5"
                value={glueLapWidth}
                onChange={(e)=>setGlueLapWidth(+e.target.value)}
                className="border rounded p-2"
              />
            </label>

            <label className="flex flex-col text-sm">
              <span>Extension a (mm)</span>
              <input
                type="number"
                step="0.5"
                value={glueLapExtension}
                onChange={(e)=>setGlueLapExtension(+e.target.value)}
                className="border rounded p-2"
              />
            </label>

            <label className="flex flex-col text-sm">
              <span>Bevel angle (°)</span>
              <input
                type="number"
                step="0.5"
                value={bevelAngle}
                onChange={(e)=>setBevelAngle(+e.target.value)}
                className="border rounded p-2"
              />
            </label>

            <label className="flex flex-col text-sm">
              <span>Slot width (mm)</span>
              <input
                type="number"
                step="0.5"
                value={slotWidth}
                onChange={(e)=>setSlotWidth(+e.target.value)}
                className="border rounded p-2"
              />
            </label>
          </div>
        </section>
      </div>

      {/* 2D Preview */}
      <div className="lg:col-span-8">
        <BoxPreview2D
          // core dims
          L={L}
          W={W}
          H={D}                     // map D->H for the renderer
          // material
          thickness={fluteThickness}
          // glue settings
          glueSide={gluePosition}
          glueOff={glueLapOff}
          glueLap={glueLapWidth}
          glueExt={glueLapExtension}
          bevelDeg={bevelAngle}
          slotWidth={slotWidth}
          // keep dims/labels on (no inputs for these per your request)
          showDims={true}
          showLabels={true}
        />
      </div>
    </div>
  );
}
