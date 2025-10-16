// app/page.js
"use client";

import { useMemo, useState } from "react";
import BoxPreview2D from "../components/BoxPreview2D";

export default function Page() {
  // --- the 10 inputs controlled here (left column) ---
  const [L, setL] = useState(300);           // 1
  const [W, setW] = useState(200);           // 2
  const [D, setD] = useState(150);           // 3  (height)
  const [fluteThickness, setFluteThickness] = useState(4); // 4
  const [glueSide, setGlueSide] = useState("inside");       // 5
  const [glueOff, setGlueOff] = useState("small");          // 6 ("small"=W panel, "large"=L panel)
  const [glueLap, setGlueLap] = useState(28);               // 7
  const [glueExtA, setGlueExtA] = useState(0);              // 8
  const [bevelDeg, setBevelDeg] = useState(30);             // 9
  const [slotWidth, setSlotWidth] = useState(6);            // 10

  // derived object passed to the 2D component
  const inputs = useMemo(
    () => ({
      L: +L,
      W: +W,
      H: +D,
      thickness: +fluteThickness,
      glueSide,
      glueOff,
      glueLap: +glueLap,
      glueExt: +glueExtA,
      bevelDeg: +bevelDeg,
      slotWidth: +slotWidth,

      // fixed for now (you can expose later if you like)
      gapTopInner: 4,
      gapTopOuter: 4,
      gapBotInner: 4,
      gapBotOuter: 4,
      adds: { P1: 0, P2: 0, P3: 0, P4: 0 },
      showDims: true,
      showLabels: true,
    }),
    [
      L, W, D,
      fluteThickness,
      glueSide, glueOff,
      glueLap, glueExtA,
      bevelDeg, slotWidth,
    ]
  );

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT: the 10 inputs */}
      <div className="lg:col-span-4 space-y-4">
        <h2 className="text-lg font-semibold">Internal Dimensions (mm)</h2>
        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col text-sm">
            <span>L</span>
            <input type="number" value={L} onChange={e => setL(e.target.value)} className="border rounded p-1"/>
          </label>
          <label className="flex flex-col text-sm">
            <span>W</span>
            <input type="number" value={W} onChange={e => setW(e.target.value)} className="border rounded p-1"/>
          </label>
          <label className="flex flex-col text-sm">
            <span>D</span>
            <input type="number" value={D} onChange={e => setD(e.target.value)} className="border rounded p-1"/>
          </label>
        </div>

        <h2 className="text-lg font-semibold">Allowances &amp; Material</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col text-sm">
            <span>Flute thickness</span>
            <input type="number" value={fluteThickness} onChange={e => setFluteThickness(e.target.value)} className="border rounded p-1"/>
          </label>
        </div>

        <h2 className="text-lg font-semibold">Glue-lap Geometry</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col text-sm">
            <span>Glue position</span>
            <select value={glueSide} onChange={e => setGlueSide(e.target.value)} className="border rounded p-1">
              <option value="inside">Inside glue</option>
              <option value="outside">Outside glue</option>
            </select>
          </label>

          <label className="flex flex-col text-sm">
            <span>Glue lap off</span>
            <select value={glueOff} onChange={e => setGlueOff(e.target.value)} className="border rounded p-1">
              <option value="small">Small panel (W)</option>
              <option value="large">Large panel (L)</option>
            </select>
          </label>

          <label className="flex flex-col text-sm">
            <span>Glue-lap width (mm)</span>
            <input type="number" value={glueLap} onChange={e => setGlueLap(e.target.value)} className="border rounded p-1"/>
          </label>

          <label className="flex flex-col text-sm">
            <span>Extension a (mm)</span>
            <input type="number" value={glueExtA} onChange={e => setGlueExtA(e.target.value)} className="border rounded p-1"/>
          </label>

          <label className="flex flex-col text-sm">
            <span>Bevel angle (°)</span>
            <input type="number" value={bevelDeg} onChange={e => setBevelDeg(e.target.value)} className="border rounded p-1"/>
          </label>

          <label className="flex flex-col text-sm">
            <span>Slot width (mm)</span>
            <input type="number" value={slotWidth} onChange={e => setSlotWidth(e.target.value)} className="border rounded p-1"/>
          </label>
        </div>
      </div>

      {/* RIGHT: purely the 2D drawing */}
      <div className="lg:col-span-8">
        <BoxPreview2D inputs={inputs} />
      </div>
    </div>
  );
}
