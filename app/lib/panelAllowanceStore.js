// app/lib/panelAllowanceStore.js

// Row shape:
// {
//   flute: "B",
//   panels: { p1:0, p2:0, p3:0, p4:0, gl:0 },
//   hsc:    { flap:0, h1:0 },
//   rsc:    { flap:0, h1:0 },
//   ffsc:   { flap:0, h1:0 },
// }

// These are the defaults taken from your image.
// They are keyed by FLUTE; thickness is shown in the UI from the flute table.
export const DEFAULT_PANEL_ALLOWANCES = {
  inside: [
    { flute: "E",  panels:{p1:2,  p2:2,  p3:2,  p4:0, gl:28}, hsc:{flap:0, h1:2},  rsc:{flap:0, h1:3},  ffsc:{flap:0, h1:6}  },
    { flute: "R",  panels:{p1:2,  p2:2,  p3:3,  p4:0, gl:28}, hsc:{flap:0, h1:3},  rsc:{flap:0, h1:5},  ffsc:{flap:0, h1:7}  },
    { flute: "B",  panels:{p1:3,  p2:3,  p3:3,  p4:0, gl:28}, hsc:{flap:0, h1:3},  rsc:{flap:0, h1:6},  ffsc:{flap:0, h1:8}  },
    { flute: "C",  panels:{p1:4,  p2:4,  p3:4,  p4:1, gl:28}, hsc:{flap:1, h1:4},  rsc:{flap:1, h1:8},  ffsc:{flap:1, h1:12} },
    { flute: "A",  panels:{p1:5,  p2:5,  p3:5,  p4:2, gl:30}, hsc:{flap:3, h1:5},  rsc:{flap:3, h1:10}, ffsc:{flap:1, h1:14} },
    { flute: "BE", panels:{p1:5,  p2:5,  p3:5,  p4:2, gl:30}, hsc:{flap:3, h1:5},  rsc:{flap:3, h1:10}, ffsc:{flap:1, h1:14} },
    { flute: "BR", panels:{p1:5,  p2:5,  p3:5,  p4:2, gl:30}, hsc:{flap:3, h1:5},  rsc:{flap:3, h1:11}, ffsc:{flap:1, h1:15} },
    { flute: "BC", panels:{p1:7,  p2:7,  p3:7,  p4:2, gl:35}, hsc:{flap:4, h1:7},  rsc:{flap:4, h1:14}, ffsc:{flap:0, h1:20} },
    { flute: "AC", panels:{p1:10, p2:10, p3:10, p4:7, gl:35}, hsc:{flap:6, h1:10}, rsc:{flap:6, h1:20}, ffsc:{flap:4, h1:28} },
  ],
  outside: [
    { flute: "E",  panels:{p1:2,  p2:2,  p3:2,  p4:0,  gl:28}, hsc:{flap:0, h1:2},  rsc:{flap:0, h1:3},  ffsc:{flap:0, h1:6}  },
    { flute: "R",  panels:{p1:4,  p2:2,  p3:2,  p4:0,  gl:28}, hsc:{flap:0, h1:3},  rsc:{flap:0, h1:5},  ffsc:{flap:0, h1:7}  },
    { flute: "B",  panels:{p1:5,  p2:3,  p3:3,  p4:0,  gl:28}, hsc:{flap:0, h1:3},  rsc:{flap:0, h1:6},  ffsc:{flap:0, h1:8}  },
    { flute: "C",  panels:{p1:6,  p2:4,  p3:4,  p4:0,  gl:28}, hsc:{flap:1, h1:4},  rsc:{flap:1, h1:8},  ffsc:{flap:0, h1:12} },
    { flute: "A",  panels:{p1:8,  p2:5,  p3:5,  p4:0,  gl:30}, hsc:{flap:3, h1:5},  rsc:{flap:3, h1:10}, ffsc:{flap:1, h1:14} },
    { flute: "BE", panels:{p1:8,  p2:5,  p3:5,  p4:0,  gl:30}, hsc:{flap:3, h1:5},  rsc:{flap:3, h1:10}, ffsc:{flap:1, h1:14} },
    { flute: "BR", panels:{p1:8,  p2:5,  p3:5,  p4:0,  gl:30}, hsc:{flap:3, h1:5},  rsc:{flap:3, h1:11}, ffsc:{flap:1, h1:15} },
    { flute: "BC", panels:{p1:12, p2:7,  p3:7,  p4:-2, gl:35}, hsc:{flap:4, h1:7},  rsc:{flap:4, h1:14}, ffsc:{flap:0, h1:20} },
    { flute: "AC", panels:{p1:17, p2:10, p3:10, p4:0,  gl:35}, hsc:{flap:6, h1:10}, rsc:{flap:6, h1:20}, ffsc:{flap:4, h1:28} },
    // Your screenshot also shows AA(10). If you add flute AA(10) to the flute table later,
    // just add a default here similarly.
  ],
};

const STORAGE_KEY = "panelAllowancesV1";

// Helpers
export function makeBlankRow(flute = "") {
  return {
    flute,
    panels: { p1: 0, p2: 0, p3: 0, p4: 0, gl: 0 },
    hsc: { flap: 0, h1: 0 },
    rsc: { flap: 0, h1: 0 },
    ffsc: { flap: 0, h1: 0 },
  };
}

export function sanitizeRow(row) {
  const num = (v) => (v === "" || v === null || v === undefined ? 0 : Number(v));
  return {
    flute: String(row.flute || "").toUpperCase().trim(),
    panels: {
      p1: num(row.panels?.p1),
      p2: num(row.panels?.p2),
      p3: num(row.panels?.p3),
      p4: num(row.panels?.p4),
      gl: num(row.panels?.gl),
    },
    hsc:  { flap: num(row.hsc?.flap),  h1: num(row.hsc?.h1) },
    rsc:  { flap: num(row.rsc?.flap),  h1: num(row.rsc?.h1) },
    ffsc: { flap: num(row.ffsc?.flap), h1: num(row.ffsc?.h1) },
  };
}

function arrayToMapByFlute(arr = []) {
  const m = new Map();
  arr.forEach((r) => m.set(String(r.flute).toUpperCase(), sanitizeRow(r)));
  return m;
}

// Build defaults from your constants, and ensure there's a row for every flute in the flute table.
export function defaultsFromFlutes(fluteTable) {
  const insideDefaults = arrayToMapByFlute(DEFAULT_PANEL_ALLOWANCES.inside);
  const outsideDefaults = arrayToMapByFlute(DEFAULT_PANEL_ALLOWANCES.outside);

  const inside = [];
  const outside = [];

  fluteTable.forEach((f) => {
    const key = String(f.flute).toUpperCase();
    inside.push(insideDefaults.get(key) || makeBlankRow(key));
    outside.push(outsideDefaults.get(key) || makeBlankRow(key));
  });

  return { inside, outside };
}

export function loadPanelAllowances(fluteTable) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const d = defaultsFromFlutes(fluteTable);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
      return d;
    }
    const parsed = JSON.parse(raw);

    // Sanitize and make sure all flutes have rows
    const ensure = (existingArr, defaultArr) => {
      const byFlute = arrayToMapByFlute(existingArr);
      // Add any defaults that don't exist yet
      defaultArr.forEach((defRow) => {
        const key = defRow.flute;
        if (!byFlute.has(key)) byFlute.set(key, defRow);
      });
      // Ensure entries for every flute in the current flute table
      fluteTable.forEach((f) => {
        const key = String(f.flute).toUpperCase();
        if (!byFlute.has(key)) byFlute.set(key, makeBlankRow(key));
      });
      return Array.from(byFlute.values()).map(sanitizeRow);
    };

    const dflt = defaultsFromFlutes(fluteTable);
    return {
      inside: ensure(parsed.inside || [], dflt.inside),
      outside: ensure(parsed.outside || [], dflt.outside),
    };
  } catch {
    const d = defaultsFromFlutes(fluteTable);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    return d;
  }
}

export function savePanelAllowances(value) {
  const clean = {
    inside: (value.inside || []).map(sanitizeRow),
    outside: (value.outside || []).map(sanitizeRow),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  return clean;
}

export function resetPanelAllowances(fluteTable) {
  const d = defaultsFromFlutes(fluteTable);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  return d;
}
