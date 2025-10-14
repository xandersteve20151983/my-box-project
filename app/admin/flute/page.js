"use client";

import Link from "next/link";
import FluteTable from "./table.client"; // <-- make sure default export exists

export default function FluteAdminPage() {
  return (
    <main className="p-6">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-semibold">Flute & Thickness</h1>
        <Link href="/admin" className="text-blue-600 hover:underline">
          ← Back to Admin
        </Link>
      </div>

      <FluteTable />
    </main>
  );
}
