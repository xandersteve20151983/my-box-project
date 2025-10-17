// app/page.client.js
"use client";
import React from "react";
import Workbench from "./components/Workbench";
import ControlsPanel from "./components/ControlsPanel";
import BoxPreview2D from "./components/BoxPreview2D";

export default function PageClient() {
  const InputPanel = () => <div className="space-y-4"><ControlsPanel /></div>;
  const Output2DBlank = () => <div className="h-full w-full"><BoxPreview2D /></div>;

  const ManufacturingDrawing = () => <div className="h-full w-full">Manufacturing drawing goes here.</div>;
  const FoldedFlat            = () => <div className="h-full w-full">Folded flat preview goes here.</div>;
  const Folded3D              = () => <div className="h-full w-full">3D folded viewer goes here.</div>;
  const Palletisation         = () => <div className="h-full w-full">Palletisation view goes here.</div>;
  const TruckUtilisation      = () => <div className="h-full w-full">Truck utilisation view goes here.</div>;

  const AdminBar = () => (
    <div className="flex gap-2 rounded-lg border bg-white/95 px-3 py-2 shadow">
      <button className="rounded border px-2 py-1 text-sm hover:bg-neutral-100">Admin</button>
    </div>
  );

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
      initialActiveIds={["2d"]}
      AdminBar={AdminBar}
    />
  );
}
