// app/page.client.js  (CLIENT)
"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import Workbench from "./components/Workbench";

/* Lazy-load big components client-side */
const ControlsPanel = dynamic(() => import("./components/ControlsPanel"), { ssr: false });
const BoxPreview2D  = dynamic(() => import("./components/BoxPreview2D"),  { ssr: false });

/* Error boundary that shows message + stack in the panel */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, err: null }; }
  static getDerivedStateFromError(err) { return { hasError: true, err }; }
  componentDidCatch(err) { console.error("Output panel crashed:", err); }
  render() {
    if (this.state.hasError) {
      const msg = this.state.err?.message || String(this.state.err || "");
      const stack = this.state.err?.stack || "";
      return (
        <div className="h-full w-full p-4 text-sm">
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-900">
            <div className="font-medium mb-1">This panel failed to load.</div>
            <div className="opacity-80 mb-2">{msg}</div>
            <details className="opacity-70">
              <summary>Stack</summary>
              <pre className="whitespace-pre-wrap text-xs mt-1">{stack}</pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* LEFT: inputs */
const InputPanel = () => (
  <div className="space-y-4">
    <Suspense fallback={<div className="text-sm text-neutral-500">Loading inputs…</div>}>
      <ErrorBoundary>
        <ControlsPanel />
      </ErrorBoundary>
    </Suspense>
  </div>
);

/* MIDDLE: 2D tile with min height */
const Output2DBlank = () => (
  <div className="w-full min-h-[500px]">
    <Suspense fallback={<div className="text-sm text-neutral-500">Loading 2D drawing…</div>}>
      <ErrorBoundary>
        <BoxPreview2D />
      </ErrorBoundary>
    </Suspense>
  </div>
);

/* Placeholders until wired */
const ManufacturingDrawing = () => <div className="h-full w-full">Manufacturing drawing goes here.</div>;
const FoldedFlat            = () => <div className="h-full w-full">Folded flat preview goes here.</div>;
const Folded3D              = () => <div className="h-full w-full">3D folded viewer goes here.</div>;
const Palletisation         = () => <div className="h-full w-full">Palletisation view goes here.</div>;
const TruckUtilisation      = () => <div className="h-full w-full">Truck utilisation view goes here.</div>;

/* Admin */
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
      initialActiveIds={["2d"]}  // add "mfg" if you want 2 tiles by default
      AdminBar={AdminBar}
    />
  );
}
