"use client";

import Link from "next/link";

type Section = {
  key: string;
  title: string;
  desc: string;
  href?: string; // if omitted, card is not clickable and shows "Coming soon."
};

const SECTIONS: Section[] = [
  // existing
  {
    key: "flutes",
    title: "Flute & Thickness",
    desc: "Edit flute codes and their thicknesses used by the Box Tool.",
    href: "/admin/flute", // ← singular to match your folder
  },
  {
    key: "allowances",
    title: "Panel Allowances",
    desc: "Configure panel adds (P1–P4), H1 and flap allowances by flute/side.",
    href: "/admin/panel-allowances", // ← make it a link again
  },

  // new ones
  {
    key: "pallets",
    title: "Pallets",
    desc: "Define standard pallets (size, deck type, max height, weight limits).",
    href: "/admin/pallets",
  },
  {
    key: "pallet-patterns",
    title: "Pallet Patterns",
    desc: "Create layer patterns, rotations, interlocks, caps, slipsheets, ties.",
    href: "/admin/pallet-patterns",
  },
  {
    key: "machines",
    title: "Machine Specifications",
    desc: "Set die-cutter/slotter/gluer limits, min slots, max sheet, speeds.",
    href: "/admin/machines",
  },
  {
    key: "trucks",
    title: "Trucks",
    desc: "Truck/container internal dims, door clearances, legal weight limits.",
    href: "/admin/trucks",
  },
  {
    key: "corrugator-trim",
    title: "Corrugator Trim",
    desc: "Available web widths, trim rules, splice allowances.",
    href: "/admin/corrugator-trim",
  },
  {
    key: "board-grades",
    title: "Board Grades",
    desc: "Grade catalogue: flute mix, GSMs, ECT/BCT targets, cost per m².",
    href: "/admin/board-grades",
  },
  {
    key: "moqs",
    title: "Minimum Order Quantities",
    desc: "Set MOQ rules by grade, flute, plant, or customer class.",
    href: "/admin/moqs",
  },
];

export default function AdminPage() {
  return (
    <main className="p-6">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <Link href="/" className="text-blue-600 hover:underline">
          ← Back to Box Tool
        </Link>
      </div>

      <h2 className="text-lg font-semibold mb-3">Sections</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SECTIONS.map((s) => {
          const Card = (
            <div className="border rounded-md p-4 hover:shadow-sm transition-shadow">
              <div className="font-semibold">{s.title}</div>
              <div className="text-sm text-gray-600 mt-1">
                {s.href ? s.desc : "Coming soon."}
              </div>
            </div>
          );

          // clickable if href provided, otherwise static card
          return s.href ? (
            <Link key={s.key} href={s.href} className="block">
              {Card}
            </Link>
          ) : (
            <div key={s.key}>{Card}</div>
          );
        })}
      </div>
    </main>
  );
}
