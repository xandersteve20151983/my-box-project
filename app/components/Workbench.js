// components/Workbench.js
"use client";
import React, { useMemo, useState, useCallback } from "react";

/**
 * Props:
 * - InputPanel:   React component containing your whole left-side inputs.
 * - outputs:      Array of { id, title, Component } available on the right.
 * - initialActiveIds: string[] of outputs that should start in the middle grid (e.g. ["2d"])
 * - AdminBar:     Optional React component rendered at top-right.
 */
export default function Workbench({ InputPanel, outputs, initialActiveIds = [], AdminBar }) {
  const outputMap = useMemo(() => {
    const m = new Map();
    outputs.forEach(o => m.set(o.id, o));
    return m;
  }, [outputs]);

  const [activeIds, setActiveIds] = useState(initialActiveIds);

  const available = useMemo(
    () => outputs.filter(o => !activeIds.includes(o.id)),
    [outputs, activeIds]
  );

  const onDragStart = (e, id) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "copy";
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    setActiveIds(prev => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const removeFromGrid = (id) => setActiveIds(prev => prev.filter(x => x !== id));

  // Simple responsive grid logic
  const gridCols =
    activeIds.length <= 1 ? "grid-cols-1"
    : activeIds.length === 2 ? "grid-cols-2"
    : activeIds.length <= 4 ? "grid-cols-2 md:grid-cols-2"
    : "grid-cols-3";

  return (
    <div className="relative h-[calc(100vh-0px)] w-full overflow-hidden">
      {/* Admin at top-right */}
      {AdminBar && (
        <div className="absolute right-3 top-3 z-40">
          <AdminBar />
        </div>
      )}

      <div className="grid h-full w-full grid-cols-[340px_minmax(0,1fr)_320px]">
        {/* LEFT: Generic Inputs */}
        <aside className="border-r bg-white/90 overflow-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-3">Generic Input</h2>
            <InputPanel />
          </div>
        </aside>

        {/* MIDDLE: Output grid (droppable) */}
        <main
          className="relative overflow-auto bg-neutral-50"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <div className={`p-4 grid gap-4 ${gridCols} auto-rows-[minmax(320px,auto)]`}>
            {activeIds.length === 0 && (
              <div className="col-span-full rounded-lg border-2 border-dashed p-10 text-center text-neutral-500">
                Drag outputs from the right to place them here
              </div>
            )}

            {activeIds.map(id => {
              const item = outputMap.get(id);
              if (!item) return null;
              const Comp = item.Component;
              return (
                <section key={id} className="relative rounded-xl border bg-white shadow-sm">
                  <header className="flex items-center justify-between border-b px-3 py-2">
                    <h3 className="font-medium">{item.title}</h3>
                    <button
                      onClick={() => removeFromGrid(id)}
                      className="rounded px-2 py-1 text-sm border hover:bg-neutral-100"
                      aria-label={`Remove ${item.title}`}
                    >
                      ✕
                    </button>
                  </header>
                  <div className="p-3 h-full">
                    <Comp />
                  </div>
                </section>
              );
            })}
          </div>
        </main>

        {/* RIGHT: Output palette (draggable tiles) */}
        <aside className="border-l bg-white/95 overflow-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-3">Outputs</h2>
            <ul className="space-y-2">
              {available.map(o => (
                <li key={o.id}>
                  <div
                    draggable
                    onDragStart={(e) => onDragStart(e, o.id)}
                    className="cursor-grab rounded-lg border bg-white px-3 py-2 shadow-sm hover:bg-neutral-50 active:cursor-grabbing"
                    title="Drag into the middle panel"
                  >
                    {o.title}
                  </div>
                </li>
              ))}
              {available.length === 0 && (
                <li className="text-sm text-neutral-500">All outputs are placed in the grid.</li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
