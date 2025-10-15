// app/page.js
"use client";

import { useMemo, useState } from "react";
// Use RELATIVE imports to avoid alias issues
import BoxPreview2D from "./components/BoxPreview2D";
import ControlsPanel from "./components/ControlsPanel";
import ExpandableSection from "./components/ExpandableSection";

export default function Page() {
  const [inputs, setInputs] = useState({
    L: 300,
    W: 200,
    D: 150,
    fluteThickness: 4,
    p1: 0, p2: 0, p3: 0, p4: 0,
    flapAllowance: 0,
    flapGapInner: 4,
    flapGapOuter: 4,
    glueLapWidth: 35,
    glueLapExtensionA: 3,
    glueLapBevelAngle: 30,
    slotWidth: 6,
    showPanelLabels: true,
    showDimLines: true,
    showFlapLabels: true,
    style: "FEFCO 0201",
  });

  const derived = useMemo(() => {
    const {
      L, W, D, p1, p2, p3, p4,
      flapAllowance, glueLapWidth, glueLapExtensionA,
      flapGapInner, flapGapOuter
    } = inputs;

    const P1 = L + p1;
    const P2 = W + p2;
    const P3 = L + p3;
    const P4 = W + p4;

    const glueLap = glueLapWidth + glueLapExtensionA;
    const blankWidth = glueLap + P1 + P2 + P3 + P4;

    const topFlap_P2 = (W / 2) + flapAllowance - (flapGapOuter / 2);
    const topFlap_P4 = (W / 2) + flapAllowance - (flapGapOuter / 2);
    const topFlap_P1 = (L / 2) + flapAllowance - (flapGapInner / 2);
    const topFlap_P3 = (L / 2) + flapAllowance - (flapGapInner / 2);

    const botFlap_P2 = topFlap_P2;
    const botFlap_P4 = topFlap_P4;
    const botFlap_P1 = topFlap_P1;
    const botFlap_P3 = topFlap_P3;

    const topFlapMax = Math.max(topFlap_P1, topFlap_P2, topFlap_P3, topFlap_P4);
    const botFlapMax = Math.max(botFlap_P1, botFlap_P2, botFlap_P3, botFlap_P4);
    const scoreToScore = D + topFlapMax + botFlapMax;

    return {
      P1, P2, P3, P4,
      glueLap,
      blankWidth,
      scoreToScore,
      top: { P1: topFlap_P1, P2: topFlap_P2, P3: topFlap_P3, P4: topFlap_P4 },
      bottom: { P1: botFlap_P1, P2: botFlap_P2, P3: botFlap_P3, P4: botFlap_P4 },
    };
  }, [inputs]);

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
      <aside className="lg:col-span-4">
        <ControlsPanel inputs={inputs} setInputs={setInputs} />
      </aside>

      <main className="lg:col-span-8 space-y-4">
        <ExpandableSection title="2D Blank Drawing" defaultOpen>
          <BoxPreview2D inputs={inputs} derived={derived} />
        </ExpandableSection>

        <ExpandableSection title="Manufacturing Drawing" defaultOpen={false}>
          <div className="text-sm text-gray-600 italic">Placeholder – to be populated after 2D spec is finalised.</div>
        </ExpandableSection>

        <ExpandableSection title="Folded Flat" defaultOpen={false}>
          <div className="text-sm text-gray-600 italic">Placeholder.</div>
        </ExpandableSection>

        <ExpandableSection title="3D Folded" defaultOpen={false}>
          <div className="text-sm text-gray-600 italic">Placeholder (3D comes later).</div>
        </ExpandableSection>

        <ExpandableSection title="Palletisation - Supplied Product" defaultOpen={false}>
          <div className="text-sm text-gray-600 italic">Placeholder – next major feature we’ll wire after 2D.</div>
        </ExpandableSection>

        <ExpandableSection title="Truck Utilisation - Supplied Product" defaultOpen={false}>
          <div className="text-sm text-gray-600 italic">Placeholder.</div>
        </ExpandableSection>

        <ExpandableSection title="Machine Suitability" defaultOpen={false}>
          <div className="text-sm text-gray-600 italic">Placeholder.</div>
        </ExpandableSection>

        <ExpandableSection title="Palletisation - Customer Product" defaultOpen={false}>
          <div className="text-sm text-gray-600 italic">Placeholder.</div>
        </ExpandableSection>

        <ExpandableSection title="Safety Factor" defaultOpen={false}>
          <div className="text-sm text-gray-600 italic">Placeholder.</div>
        </ExpandableSection>

        <ExpandableSection title="Quality Tolerances" defaultOpen={false}>
          <div className="text-sm text-gray-600 italic">Placeholder.</div>
        </ExpandableSection>

        <ExpandableSection title="Technical Specifications" defaultOpen={false}>
          <div className="text-sm text-gray-600 italic">Placeholder.</div>
        </ExpandableSection>

        <ExpandableSection title="Downloads and Reports" defaultOpen={false}>
          <div className="text-sm text-gray-600 italic">Placeholder.</div>
        </ExpandableSection>
      </main>
    </div>
  );
}
