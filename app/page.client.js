// app/page.client.js  (CLIENT)
"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import Workbench from "./components/Workbench";

/* 
  Dynamically load your big components on the client only.
  If one of them throws (missing context, undefined props, etc.),
  the ErrorBoundary will keep the rest of the UI alive and show a clear panel message.
*/
const ControlsPanel = dynamic(() => import("./components/ControlsPanel"), {
  ssr: false,
});
const BoxPreview2D = dynamic(() => import("./components/BoxPreview2D"), {
  ssr: false,
});

/* ---------- Minimal Error Boundary ---------- */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, err: null };
  }
  static getDerivedStateFromError(err) {
    return { hasError: true, err };
  }
  componentDidCatch(err) {
    // eslint-disable-next-line no-console
    console.error("Output panel crashed:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full p-4 text-sm">
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-900">
            <div className="font-medium">This panel failed to load.</div>
            <div className="mt-1 opacity-80">
              Check the browser console for the first error. Common causes:
              missing provider/context, reading undefined inputs (e.g., L/W/D),
              or code assuming `window` before mount.
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---------- Left-side inputs ---------- */
const InputPanel = () => (
  <div className="space-y-4">
    <Suspense fallback={<div className="text-sm text-neutral-500">Loading inputs…</div>}>
      <ErrorBoundary>
        <ControlsPanel />
      </ErrorBoundary>
    </Suspense>
  </div>
);

/* ---------- Middle tiles ---------- */
const Output2DBlank = () => (
  <div className="h-full w-full">
    <Suspense fallback={<div className="text-sm text-neutral-500">Loading 2D drawing…</div>}>
      <ErrorBoundary>
        <BoxPreview2D />
      </ErrorBoundary>
    </Suspense>
  </div>
);

/* ---------- Placeholders for the rest ---------- */
const ManufacturingDrawing = () => <div className="h-full w-full">Manufacturing drawing goes here.</div>;
const FoldedFlat            = () => <div className="h-full w-full">Folded flat preview goes here.</div>;
const Folded3D              = () => <div className="h-full w-full">3D folded viewer goes here.</div>;
const Palletisation         = () => <div className="h-full w-full">Palletisation view goes here.</div>;
const TruckUtilisation      = () => <div className="h-full w-full">Truck utilisation view goes here.</div>;

/* ---------- Admin ---------- */
const AdminBar = () => (
  <div className="flex gap-2 rounded-lg border bg-white/95 px-3 py-2 shadow">
    <button className="rounded border px-2 py-1 text-sm hover:bg-neutral-100">Admin</button>
  </div>
);

export default function PageClient() {
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
      initialActiveIds={["2d"]}   // add "mfg" to start with two tiles
      AdminBar={AdminBar}
    />
  );
}
