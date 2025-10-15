// components/ExpandableSection.js
"use client";

import { useState } from "react";

export default function ExpandableSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border rounded-2xl shadow-sm">
      <header
        className="flex items-center justify-between px-3 py-2 cursor-pointer select-none bg-gray-50 rounded-t-2xl"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 flex items-center justify-center border rounded-md text-sm font-mono">
            {open ? "-" : "+"}
          </div>
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
      </header>

      {open && (
        <div className="p-3">
          {children}
        </div>
      )}
    </section>
  );
}
