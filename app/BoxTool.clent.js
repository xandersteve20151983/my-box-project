// app/BoxTool.client.js
"use client";

import { useState } from "react";
import BoxPreview from "./components/BoxPreview";

export default function BoxTool() {
  // single source of truth for the chosen style
  const [style, setStyle] = useState("0201");

  const initial = { L: 267, W: 120, H: 80, t: 3, style };

  return (
    <div>
      {/* Example controls. Replace these with your modal hooks later */}
      <div className="flex gap-2 mb-3">
        {["0200","0201","0202","0203","0204","0205","0206"].map(code => (
          <button
            key={code}
            onClick={() => setStyle(code)}
            className={`px-2 py-1 border rounded ${style===code ? "bg-gray-200" : ""}`}
            title={`Set style ${code}`}
          >
            {code}
          </button>
        ))}
      </div>

      {/* BoxPreview will auto-sync to `style` prop */}
      <BoxPreview initial={initial} style={style} />
    </div>
  );
}
