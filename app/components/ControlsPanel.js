// app/components/ControlsPanel.js
"use client";
import React, { useEffect, useState } from "react";
// import your store/hooks as before

const num = (v, d) => (v === undefined || v === null || v === "" || Number.isNaN(+v) ? d : +v);

const DEFAULTS = {
  L: 284,
  W: 200,
  D: 150,
  fluteThickness: 3,
  p1: 0, p2: 0, p3: 0, p4: 0,
  gapInner: 4, gapOuter: 4,
  glueWidth: 35,
  aExt: 76,
  bevelAngle: 30,
  slotWidth: 6,
  showDims: true,
};

export default function ControlsPanel() {
  // If you read from a store, keep that code, but default to {} to render safely:
  // const inputs = useBoxStore(state => state.inputs) || {};
  // const setInputs = useBoxStore(state => state.setInputs);

  // If you’re using local state in this component, initialize with DEFAULTS:
  const [inputs, setInputs] = useState(DEFAULTS);

  // If you hydrate from localStorage or URL, do it AFTER mount:
  useEffect(() => {
    try {
      const raw = localStorage.getItem("boxInputs");
      if (raw) {
        const data = JSON.parse(raw);
        setInputs(prev => ({
          ...DEFAULTS,
          ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, num(v, DEFAULTS[k])])),
        }));
      }
    } catch {/* ignore */}
  }, []);

  // …your existing inputs UI, but when reading values, coerce with num():
  // <input value={num(inputs.L, DEFAULTS.L)} onChange={…} />

  return (
    <div>
      {/* render your existing form fields, using inputs with defaults */}
    </div>
  );
}
