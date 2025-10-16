// app/page.js
"use client";

import { useMemo, useState } from "react";
import BoxPreview2D from "./components/BoxPreview2D";
import ControlsPanel from "./components/ControlsPanel";
import ExpandableSection from "./components/ExpandableSection";

export default function Page() {
  const [inputs, setInputs] = useState({
    // Internal dims
    L: 300, W: 200, D: 150,

    // Allowances
    fluteThickness: 4,
    p1: 0, p2: 0, p3: 0, p4: 0,
    flapAllowance: 0,
    flapGapInner: 4,
    flapGapOuter: 4,

    // Glue-lap
    glueLapWidth: 35,
    glueLapExtensionA: 0,
    glueLapBevelAngle: 30,
    gluePosition: "inside",      // "inside" | "outside" (visual)
    glueLapOff: "small",         // "small" | "large" (placeholder for rules)

    // Slots & display
    slotWidth: 6,
    showPanelLabels: true,
    showDimLines: true,
    showFlapLabels: true,

    // Style/Flute selectors (placeholders for rules later)
    parentStyle: "0200",
    styleCode:  "0201",
    fluteCode:  "B",             // B, C, E, etc.
    style: "FEFCO 0201",
  });

  const derived = useMemo(() => {
    const {
      L, W, D,
      p1, p2, p3, p4,
      flapAllowance,
      flapGapInner, flapGapOuter,
      glueLapWidth,
    } = inputs;

    // Panels (RSC): P1=L, P2=W, P3=L, P4=W (+ per-panel allowances)
    const P1 = L + p1;
    const P2 = W + p2;
    const P3 = L + p3;
    const P4 = W + p4;

    // Flap heights (top & bottom) – standard “W/2 and L/2 with gaps/allowance”
    const top = {
      P1: Math.max(0, L / 2 + flapAllowance - flapGapInner / 2),
      P2: Math.max(0, W / 2 + flapAllowance - flapGapOuter / 2),
      P3: Math.max(0, L / 2 + flapAllowance - flapGapInner / 2),
      P4: Math.max(0, W / 2 + flapAllowance - flapGapOuter / 2),
    };
    const bottom = { ...top };

    // S2S height = D + 2*flute? — for now keep D + flute thickness (visual)
    const scoreToScore = D + inputs.fluteThickness * 1;

    // Glue-lap panel width (IMPORTANT: no +a here)
    const glueLap = glueLapWidth;

    // Overall blank width
    const blankWidth = glueLap + P1 + P2 + P3 + P4;

    return {
      P1, P2, P3, P4,
      glueLap,
      blankWidth,
      scoreToScore,
      top,
      bottom,
    };
  }, [inputs]);

  return (
    <div className="mx-auto max-w-[1400px] p-4 space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ControlsPanel inputs={inputs} setInputs={setInputs} />
        <ExpandableSection title="2D Blank Drawing" defaultOpen>
          <BoxPreview2D inputs={inputs} derived={derived} />
        </ExpandableSection>
      </div>

      {/* Placeholders you asked for */}
      <ExpandableSection title="Manufacturing Drawing" />
      <ExpandableSection title="Folded Flat" />
      <ExpandableSection title="3D Folded" />
      <ExpandableSection title="Palletisation - Supplied Product" />
      <ExpandableSection title="Truck Utilisation - Supplied Product" />
    </div>
  );
}
