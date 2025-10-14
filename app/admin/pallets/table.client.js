"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_ROWS = [
  { id: crypto.randomUUID(), type: "Chep",   length: 1165, width: 1165, height: 150, weight: 30 },
  { id: crypto.randomUUID(), type: "VBS",    length: 1165, width: 1165, height: 150, weight: 30 },
  { id: crypto.randomUUID(), type: "Loscom", length: 1165, width: 1165, height: 150, weight: 30 },
];

const LS_KEY = "admin:pallets";

export default function PalletTable() {
  const [rows, setRows] = useState(DEFAULT_ROWS);

  // Load once from localStorage (simple persistence for now)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) setRows(parsed);
      }
    } catch {}
  }, []);

  // Save whenever rows change
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(rows));
    } catch {}
  }, [rows]);

  const addRow = () => {
    setRows((r) => [
      ...r,
      { id: crypto.randomUUID(), type: "", length: 1200, width: 1000, height: 150, weight: 30 },
    ]);
  };

  const deleteRow = (id) => setRows((r) => r.filter((x) => x.id !== id));

  const update = (id, field, value) => {
    setRows((r) =>
      r.map((row) => {
        if (row.id !== id) return row;
        // numeric fields (mm/kg)
        if (["length", "width", "height", "weight"].includes(field)) {
          const num = value === "" ? "" : Number(value);
          return { ...row, [field]: Number.isFinite(num) ? num : row[field] };
        }
        return { ...row, [field]: value };
      })
    );
  };

  const totals = useMemo(() => {
    // not essential, but nice: count of rows
    return { count: rows.length };
  }, [rows]);

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Standard Pallet Catalogue</h2>
        <div className="text-sm text-gray-500">Rows: {totals.count}</div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full table-auto">
          <thead className="bg-gray-50 text-left text-sm">
            <tr>
              <Th>Pallet Type</Th>
              <Th>Length (mm)</Th>
              <Th>Width (mm)</Th>
              <Th>Height (mm)</Th>
              <Th>Weight (kg)</Th>
              <Th />
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                <Td>
                  <input
                    className="input"
                    value={r.type}
                    onChange={(e) => update(r.id, "type", e.target.value)}
                    placeholder="e.g. Chep"
                  />
                </Td>
                <Td>
                  <input
                    className="input"
                    inputMode="numeric"
                    value={r.length}
                    onChange={(e) => update(r.id, "length", e.target.value)}
                  />
                </Td>
                <Td>
                  <input
                    className="input"
                    inputMode="numeric"
                    value={r.width}
                    onChange={(e) => update(r.id, "width", e.target.value)}
                  />
                </Td>
                <Td>
                  <input
                    className="input"
                    inputMode="numeric"
                    value={r.height}
                    onChange={(e) => update(r.id, "height", e.target.value)}
                  />
                </Td>
                <Td>
                  <input
                    className="input"
                    inputMode="numeric"
                    value={r.weight}
                    onChange={(e) => update(r.id, "weight", e.target.value)}
                  />
                </Td>
                <Td className="text-right">
                  <button
                    className="btn btn-danger"
                    onClick={() => deleteRow(r.id)}
                    aria-label="Delete row"
                  >
                    Delete
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <button className="btn btn-primary" onClick={addRow}>
          + Add row
        </button>
        <div className="text-xs text-gray-500">
          Values auto-save in your browser for now.
        </div>
      </div>

      {/* tiny Tailwind helpers */}
      <style jsx global>{`
        .input {
          @apply w-full rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500;
        }
        .btn {
          @apply rounded-md border px-3 py-1.5 text-sm;
        }
        .btn-primary {
          @apply border-blue-600 bg-blue-600 text-white hover:bg-blue-700;
        }
        .btn-danger {
          @apply border-red-600 bg-red-600 text-white hover:bg-red-700;
        }
      `}</style>
    </div>
  );
}

function Th({ children }) {
  return <th className="px-3 py-2 font-medium text-gray-700">{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-3 py-2 align-middle ${className}`}>{children}</td>;
}
