// app/admin/panel-allowances/editor.client.js
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  loadFluteTable,
  saveFluteTable,          // not used here but handy if you add syncing actions later
} from "../../lib/fluteStore";
import {
  loadPanelAllowances,
  savePanelAllowances,
  resetPanelAllowances,
  makeBlankRow,
} from "../../lib/panelAllowanceStore";

function numberOrEmpty(n) {
  return (n === 0 || n) ? n : "";
}

function TableSection({
  title,
  rows,
  onUpdateRow,
  onAddRow,
  onDeleteRow,
  fluteTable,
}) {
  // For read-only thickness
  const thicknessByFlute = useMemo(() => {
    const map = new Map();
    fluteTable.forEach((r) => map.set(String(r.flute).toUpperCase(), r.thickness));
    return map;
  }, [fluteTable]);

  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="overflow-auto border rounded">
        <table className="min-w-[880px] w-full">
          <thead>
            <tr className="bg-gray-100 text-left align-bottom">
              <th className="p-2 w-28">Flute</th>
              <th className="p-2 w-28">Thickness</th>
              <th className="p-2 w-16 text-center">P1</th>
              <th className="p-2 w-16 text-center">P2</th>
              <th className="p-2 w-16 text-center">P3</th>
              <th className="p-2 w-16 text-center">P4</th>
              <th className="p-2 w-16 text-center">GL</th>
              <th className="p-2 w-16 text-center">HSC<br/>FLAP</th>
              <th className="p-2 w-16 text-center">HSC<br/>H1</th>
              <th className="p-2 w-16 text-center">RSC<br/>FLAP</th>
              <th className="p-2 w-16 text-center">RSC<br/>H1</th>
              <th className="p-2 w-16 text-center">FFSC<br/>FLAP</th>
              <th className="p-2 w-16 text-center">FFSC<br/>H1</th>
              <th className="p-2 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const t = thicknessByFlute.get(String(r.flute).toUpperCase()) ?? "";
              return (
                <tr key={i} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2">
                    <select
                      value={r.flute}
                      onChange={(e) => onUpdateRow(i, "flute", e.target.value)}
                      className="border rounded p-1 w-24"
                    >
                      {fluteTable.map((f) => (
                        <option key={f.flute} value={f.flute}>
                          {f.flute}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 text-gray-600">{t} mm</td>

                  {/* Panels */}
                  {["p1","p2","p3","p4","gl"].map((k) => (
                    <td key={k} className="p-2 text-center">
                      <input
                        type="number"
                        value={numberOrEmpty(r.panels?.[k])}
                        onChange={(e) =>
                          onUpdateRow(i, ["panels", k], e.target.value)
                        }
                        className="border rounded p-1 w-16 text-center"
                      />
                    </td>
                  ))}

                  {/* HSC */}
                  {["flap","h1"].map((k) => (
                    <td key={`hsc-${k}`} className="p-2 text-center">
                      <input
                        type="number"
                        value={numberOrEmpty(r.hsc?.[k])}
                        onChange={(e) =>
                          onUpdateRow(i, ["hsc", k], e.target.value)
                        }
                        className="border rounded p-1 w-16 text-center"
                      />
                    </td>
                  ))}

                  {/* RSC */}
                  {["flap","h1"].map((k) => (
                    <td key={`rsc-${k}`} className="p-2 text-center">
                      <input
                        type="number"
                        value={numberOrEmpty(r.rsc?.[k])}
                        onChange={(e) =>
                          onUpdateRow(i, ["rsc", k], e.target.value)
                        }
                        className="border rounded p-1 w-16 text-center"
                      />
                    </td>
                  ))}

                  {/* FFSC */}
                  {["flap","h1"].map((k) => (
                    <td key={`ffsc-${k}`} className="p-2 text-center">
                      <input
                        type="number"
                        value={numberOrEmpty(r.ffsc?.[k])}
                        onChange={(e) =>
                          onUpdateRow(i, ["ffsc", k], e.target.value)
                        }
                        className="border rounded p-1 w-16 text-center"
                      />
                    </td>
                  ))}

                  <td className="p-2">
                    <button
                      onClick={() => onDeleteRow(i)}
                      className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => onAddRow()}
        className="px-3 py-1.5 border rounded hover:bg-gray-100"
      >
        + Add Row
      </button>
    </section>
  );
}

export default function PanelAllowanceEditor() {
  const [fluteTable, setFluteTable] = useState([]);
  const [data, setData] = useState({ inside: [], outside: [] });
  const [savedAt, setSavedAt] = useState(null);
  const [dirty, setDirty] = useState(false);

  // load flute table + allowances
  useEffect(() => {
    const ft = loadFluteTable();
    setFluteTable(ft);
    setData(loadPanelAllowances(ft));
  }, []);

  // helpers
  const updateRow = (which) => (index, key, value) => {
    setData((prev) => {
      const next = { ...prev, [which]: [...prev[which]] };
      const row = { ...next[which][index] };

      if (Array.isArray(key) && key.length === 2) {
        const [scope, field] = key;
        row[scope] = { ...row[scope], [field]: Number(value) };
      } else if (key === "flute") {
        row.flute = String(value).toUpperCase();
      }

      next[which][index] = row;
      return next;
    });
    setDirty(true);
  };

  const addRow = (which) => () => {
    setData((prev) => ({
      ...prev,
      [which]: [...prev[which], makeBlankRow(fluteTable[0]?.flute || "")],
    }));
    setDirty(true);
  };

  const deleteRow = (which) => (index) => {
    setData((prev) => {
      const arr = [...prev[which]];
      arr.splice(index, 1);
      return { ...prev, [which]: arr };
    });
    setDirty(true);
  };

  const onSave = () => {
    const clean = savePanelAllowances(data);
    setData(clean);
    setSavedAt(new Date().toLocaleTimeString());
    setDirty(false);
  };

  const onReload = () => {
    setData(loadPanelAllowances(fluteTable));
    setDirty(false);
  };

  const onReset = () => {
    setData(resetPanelAllowances(fluteTable));
    setSavedAt(new Date().toLocaleTimeString());
    setDirty(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 text-sm text-gray-600">
        {savedAt ? <span>Saved: {savedAt}</span> : null}
        {dirty ? <span className="text-amber-700">• unsaved changes</span> : null}
      </div>

      <TableSection
        title="INSIDE GLUE LAP"
        rows={data.inside}
        onUpdateRow={updateRow("inside")}
        onAddRow={addRow("inside")}
        onDeleteRow={deleteRow("inside")}
        fluteTable={fluteTable}
      />

      <TableSection
        title="OUTSIDE GLUE LAP"
        rows={data.outside}
        onUpdateRow={updateRow("outside")}
        onAddRow={addRow("outside")}
        onDeleteRow={deleteRow("outside")}
        fluteTable={fluteTable}
      />

      <div className="flex flex-wrap gap-2">
        <button onClick={onSave}   className="px-3 py-1.5 border rounded bg-green-600 text-white hover:bg-green-700">Save</button>
        <button onClick={onReload} className="px-3 py-1.5 border rounded hover:bg-gray-100">Reload</button>
        <button onClick={onReset}  className="px-3 py-1.5 border rounded bg-red-600 text-white hover:bg-red-700">Reset to Defaults</button>
      </div>
    </div>
  );
}
