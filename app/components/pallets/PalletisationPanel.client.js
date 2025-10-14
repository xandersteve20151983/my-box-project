// app/components/pallets/PalletisationPanel.client.js
"use client";

export default function PalletisationPanel({ ffLength, ffWidth }) {
  return (
    <div>
      <div className="text-sm text-gray-600">
        Using FF Length: <b>{ffLength}</b> mm, FF Width: <b>{ffWidth}</b> mm
      </div>

      <div className="mt-3 h-40 border rounded grid place-items-center">
        Palletisation panel placeholder
      </div>
    </div>
  );
}
