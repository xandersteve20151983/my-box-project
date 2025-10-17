// app/page.js
"use client";
import React from "react";
import Workbench from "./components/Workbench";

// ---- Plug YOUR components here ----
const InputPanel = () => {
  // Render your existing inputs (internal dims, allowances, glue, style+flute, toggles…)
  // Keep names/handlers as-is; this just relocates them into the left pane.
  return (
    <div className="space-y-4">
      {/* …your current input groups/components… */}
      {/* Example: <InternalDimensionsForm /> <AllowancesForm /> <GlueLapForm /> <StyleFluteForm /> etc. */}
    </div>
  );
};

// Your real 2D renderer component (BoxPreview/Blank2D) goes here:
const Output2DBlank = () => {
  // Return the actual 2D SVG/canvas you already have.
  return (
    <div className="h-full w-full">
      {/* <Your2DComponent /> */}
    </div>
  );
};

// Stub other outputs; replace each with your real renderers when ready.
const ManufacturingDrawing = () => <div className="h-full w-full">Manufacturing drawing goes here.</div>;
const FoldedFlat            = () => <div className="h-full w-full">Folded flat preview goes here.</div>;
const Folded3D              = () => <div className="h-full w-full">3D folded viewer goes here.</div>;
const Palletisation         = () => <div className="h-full w-full">Palletisation view goes here.</div>;
const TruckUtilisation      = () => <div className="h-full w-full">Truck utilisation view goes here.</div>;

// Optional small admin bar
const AdminBar = () => (
  <div className="flex gap-2 rounded-lg border bg-white/95 px-3 py-2 shadow">
    {/* drop your Admin controls here */}
    <button className="rounded border px-2 py-1 text-sm hover:bg-neutral-100">Admin</button>
  </div>
);

export default function Page() {
  const outputs = [
    { id: "2d",  title: "2D Blank Drawing",                 Component: Output2DBlank },
    { id: "mfg", title: "Manufacturing Drawing",            Component: ManufacturingDrawing },
    { id: "ff",  title: "Folded Flat",                      Component: FoldedFlat },
    { id: "f3d", title: "3D Folded",                        Component: Folded3D },
    { id: "pal", title: "Palletisation – Supplied Product", Component: Palletisation },
    { id: "trk", title: "Truck Utilisation – Supplied",     Component: TruckUtilisation },
  ];

  return (
    <Workbench
      InputPanel={InputPanel}
      outputs={outputs}
      initialActiveIds={["2d"]}  // start with 2D in the middle (1×1)
      AdminBar={AdminBar}
    />
  );
}
