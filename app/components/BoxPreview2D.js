// app/components/BoxPreview2D.js
"use client";
import React, { useMemo } from "react";
// import whatever you already had (store/hooks etc.)

// 👉 small helpers
const num = (v, d) => (v === undefined || v === null || v === "" || Number.isNaN(+v) ? d : +v);

export default function BoxPreview2D(props) {
  // Wherever you previously got inputs/dims, KEEP it, but make it optional.
  // Example patterns (keep your actual source of truth):
  // const inputs = useBoxStore(state => state.inputs);  // if you use Zustand
  // const inputs = props.inputs;                        // if passed as props
  // For safety, turn anything falsy into {}:
  const inputs = (props?.inputs) ?? /* your selector here */ undefined;

  // *** DEFENSIVE DEFAULTS ***
  const L = num(inputs?.L, 200);
  const W = num(inputs?.W, 200);
  const D = num(inputs?.D, 150);

  const flute = num(inputs?.fluteThickness, 3);
  const p1 = num(inputs?.p1, 0);
  const p2 = num(inputs?.p2, 0);
  const p3 = num(inputs?.p3, 0);
  const p4 = num(inputs?.p4, 0);
  const glue = num(inputs?.glueWidth, 35);
  const aExt = num(inputs?.aExt, 76);
  const angle = num(inputs?.bevelAngle, 30);
  const gapInner = num(inputs?.gapInner, 4);
  const gapOuter = num(inputs?.gapOuter, 4);
  const slotWidth = num(inputs?.slotWidth, 6);
  const showDims = !!inputs?.showDims;

  // ...the rest of your drawing math stays the same,
  // but ALWAYS use the variables above (L,W,D, etc.), never `inputs.L` directly.

  return (
    <div className="h-full w-full">
      {/* your existing SVG/canvas render that uses L,W,D,... */}
    </div>
  );
}
