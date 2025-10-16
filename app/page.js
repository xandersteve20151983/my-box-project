"use client";

import BoxPreview2D from "./components/BoxPreview2D"; // ← adjust exactly to your path/case

export default function Page() {
  // left-hand inputs feed props to the preview:
  return (
    <div className="p-4">
      {/* …your left-panel inputs… */}
      <BoxPreview2D
        controls={false}
        // pass the 10 values from the left inputs:
        L={L} W={W} H={D}
        flute={flute}
        glueSide={glueSide}
        glueOff={glueLapOff}
        glue={glueLapWidth}
        glueExt={extensionA}
        bevelDeg={bevelAngle}
        slotWidth={slotWidth}
        gapTopInner={gapTopInner}
        gapTopOuter={gapTopOuter}
        gapBotInner={gapBotInner}
        gapBotOuter={gapBotOuter}
        showDims={showDimLines}
        showLabels={showFlapLabels}
      />
    </div>
  );
}
