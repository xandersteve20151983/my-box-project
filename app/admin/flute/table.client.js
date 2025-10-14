// app/admin/flute/table.client.js
"use client";

import React, { useEffect, useState } from "react";
import {
  DEFAULT_FLUTES,
  loadFluteTable,
  saveFluteTable,
} from "../../lib/fluteStore"; // path: /app/admin/flute -> /app/lib

export default function FluteTable() {
  const [rows, setRows]   = useState(DEFAULT_FLUTES);
  const [savedAt, setSavedAt] = useState(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setRows(loadFluteTable());
  }, []);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "fluteTable") setRows(loadFluteTable());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function updateRow(i, key, val) {
    setRows(prev => {
      const next = [...prev];
      next[i] = {
        ...next[i],
        [key]:
          key === "thickness"
            ? Number(val)
            : String(val || "").toUpperCase().trim(),
      };
      return next;
    });
    setDirty(true);
  }

  function addRow() {
    setRows(prev => [...prev, { flute: "", thickness: 0 }]);
    setDirty(true);
  }

  function deleteRow(i) {
    setRows(prev => prev.filter((_, idx) => idx !== i));
    setDirty(true);
  }

  function onSave() {
    const clean = saveFluteTable(rows);
    setRows(clean);
    setSavedAt(new Date().toLocaleTimeString());
    setDirty(false);
  }

  function onReset() {
    const clean = saveFluteTable(DEFAULT_FLUTES);
    setRows(clean);
    setSavedAt(new Date().toLocaleTimeString());
    setDirty(false);
  }

  function onReload() {
    setRows(loadFluteTable());
    setDirty(false);
  }

  return (
    <>
      <div className="overflow-auto border rounded">
        <table className="min-w-[520px] w-full">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 w-40">Flute</th>
              <th className="p-2 w-40">Thickness (mm)</th>
              <th className="p-2 w-28"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="odd:bg-white even:bg-gray-50">
                <td className="p-2">
                  <input
                    value={r.flute}
                    onChange={(e) => updateRow(i, "flute", e.target.value)}
                    className="border rounded p-1 w-32"
                    placeholder="e.g. B"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    step="0.1"
                    value={r.thickness}
                    onChange={(e) => updateRow(i, "thickness", e.target.value)}
                    className="border rounded p-1 w-32"
                    placeholder="e.g. 3"
                  />
                </td>
                <td className="p-2">
                  <button
                    onClick={() => deleteRow(i)}
                    className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={addRow}   className="px-3 py-1.5 border rounded hover:bg-gray-100">+ Add Row</button>
        <button onClick={onSave}   className="px-3 py-1.5 border rounded bg-green-600 text-white hover:bg-green-700">Save</button>
        <button onClick={onReload} className="px-3 py-1.5 border rounded hover:bg-gray-100">Reload</button>
        <button onClick={onReset}  className="px-3 py-1.5 border rounded bg-red-600 text-white hover:bg-red-700">Reset to Defaults</button>
        {savedAt && <span className="text-sm text-gray-600 self-center">Saved: {savedAt}</span>}
        {dirty   && <span className="text-sm text-amber-700 self-center">• unsaved changes</span>}
      </div>
    </>
  );
}
