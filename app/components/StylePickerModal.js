// app/components/StylePickerModal.js
"use client";

import React from "react";

const STYLES = [
  { code: "0200", title: "0200" },
  { code: "0201", title: "0201" },
  { code: "0202", title: "0202" },
  { code: "0203", title: "0203" },
  { code: "0204", title: "0204" },
  { code: "0205", title: "0205" },
  { code: "0206", title: "0206" },
];

// super-simple placeholder “thumbnail”
function Thumb({ selected }) {
  return (
    <svg viewBox="0 0 120 90" className="w-full h-28">
      <rect x="10" y="20" width="100" height="55" fill="#fff" stroke="#222" />
      <polygon points="10,20 50,8 110,20 70,32" fill="#e9d6b3" stroke="#222" />
      <rect x="10" y="20" width="100" height="55" fill="none" stroke="#222" />
      {selected && (
        <rect x="3" y="3" width="114" height="84" fill="none" stroke="#2563eb" strokeWidth="3" />
      )}
    </svg>
  );
}

export default function StylePickerModal({ open, value, onSelect, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[min(920px,95vw)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="text-lg font-semibold">FEFCO 020x styles</div>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm border hover:bg-gray-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
          {STYLES.map((s) => {
            const selected = s.code === value;
            return (
              <button
                key={s.code}
                onClick={() => {
                  onSelect?.(s.code);
                  onClose?.();
                }}
                className={`rounded-xl border bg-white hover:shadow transition ${
                  selected ? "ring-2 ring-blue-500" : ""
                }`}
                title={s.title}
              >
                <div className="p-3">
                  <Thumb selected={selected} />
                </div>
                <div className="border-t px-3 py-2 text-sm text-center text-gray-700">{s.title}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
