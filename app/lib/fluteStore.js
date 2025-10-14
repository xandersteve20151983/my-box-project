// lib/fluteStore.js
export const DEFAULT_FLUTES = [
  { flute: "E",  thickness: 2   },
  { flute: "R",  thickness: 2.5 },
  { flute: "B",  thickness: 3   },
  { flute: "C",  thickness: 4   },
  { flute: "A",  thickness: 5   },
  { flute: "BE", thickness: 5   },
  { flute: "BR", thickness: 5.5 },
  { flute: "BC", thickness: 7   },
  { flute: "AC", thickness: 9   },
];

function sanitize(table) {
  if (!Array.isArray(table)) return DEFAULT_FLUTES;
  const rows = table
    .map(r => ({
      flute: String(r.flute || "").toUpperCase().trim(),
      thickness: Number(r.thickness),
    }))
    .filter(r => r.flute && !Number.isNaN(r.thickness));
  // de-dupe by flute, last one wins
  const byFlute = new Map();
  rows.forEach(r => byFlute.set(r.flute, r));
  return Array.from(byFlute.values());
}

export function loadFluteTable() {
  if (typeof window === "undefined") return DEFAULT_FLUTES;
  try {
    const raw = localStorage.getItem("fluteTable");
    if (!raw) return DEFAULT_FLUTES;
    const parsed = JSON.parse(raw);
    const clean = sanitize(parsed);
    return clean.length ? clean : DEFAULT_FLUTES;
  } catch {
    return DEFAULT_FLUTES;
  }
}

export function saveFluteTable(table) {
  const clean = sanitize(table);
  if (typeof window !== "undefined") {
    localStorage.setItem("fluteTable", JSON.stringify(clean));
  }
  return clean;
}

export function findThicknessForFlute(flute, table) {
  const F = String(flute || "").toUpperCase().trim();
  const hit = (table || []).find(r => r.flute === F);
  return hit ? Number(hit.thickness) : null;
}
