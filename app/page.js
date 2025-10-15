// app/page.js
"use client";

import { useMemo, useState } from "react";
import BoxPreview2D from "@/components/BoxPreview2D";
import ControlsPanel from "@/components/ControlsPanel";
import ExpandableSection from "@/components/ExpandableSection";

export default function Page() {
  // Core state shared by controls + 2D preview
  const [inputs, setInputs] = useState({
    // Internal dimensions (mm)
    L: 300,
    W: 200,
    D: 150,

    // Material / allowances (mm)
    fluteThickness: 4,            // e.g., C-flute ≈ 4 mm
    p1: 0, p2: 0, p3: 0, p4: 0,   // panel allowances added to respective panels
    flapAllowance: 0,             // “RSC flap allowance” from admin table
    flapGapInner: 4,              // inner top/bottom gap between meeting flaps
    flapGapOuter: 4,              // outer top/bottom gap (opposite side)

    // Glue lap geometry (mm / degrees)
    glueLapWidth: 35,             // base glue-lap width
    glueLapExtensionA: 3,         // “a” extension (extra tab past bevel)
    glueLapBevelAngle: 30,        // degrees (visual only right now)

    // Slots
    slotWidth: 6,                 // knife/slot width at scores

    // Labels / dimensions
    showPanelLabels: true,
    showDimLines: true,
    showFlapLabels: true,

    // Style selector (locked to 0201 for now)
    style: "FEFCO 0201",
  });

  // Derived geometry for convenience (kept simple & transparent)
  const derived = useMemo(() => {
    const { L, W, D, p1, p2, p3, p4, flapAllowance, flapGapInner, flapGapOuter, glueLapWidth, glueLapExtensionA } = inputs;

    // Panel widths (score-to-score across the width of the blank)
    // Order: Glue-lap | P1(L) | P2(W) | P3(L) | P4(W)
    const P1 = L + p1;
    const P2 = W + p2;
    const P3 = L + p3;
    const P4 = W + p4;

    const glueLap = glueLapWidth + glueLapExtensionA; // add the small “a” extension to the base

    const blankWidth = glueLap + P1 + P2 + P3 + P4;

    // Top/bottom flap heights (your spec: subtract gap/2)
    // Outer side = panels 2 & 4 (W-panels); Inner side = panels 1 & 3 (L-panels)
    const topFlap_P2 = (W / 2) + flapAllowance - (inputs.flapGapOuter / 2);
    const topFlap_P4 = (W / 2) + flapAllowance - (inputs.flapGapOuter / 2);
    const topFlap_P1 = (L / 2) + flapAllowance - (inputs.flapGapInner / 2);
    const topFlap_P3 = (L / 2) + flapAllowance - (inputs.flapGapInner / 2);

    // Bottom: mirror top logic (kept same unless you split gaps later)
    const botFlap_P2 = topFlap_P2;
    const botFlap_P4 = topFlap_P4;
    const botFlap_P1 = topFlap_P1;
    const botFlap_P3 =_
