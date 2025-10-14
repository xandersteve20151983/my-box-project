// app/admin/panel-allowances/page.js
import Link from "next/link";
import PanelAllowanceEditor from "./editor.client";

export default function PanelAllowancesPage() {
  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Panel Allowances</h1>
        <Link href="/admin" className="underline text-blue-600">← Admin Home</Link>
      </div>

      <p className="text-sm text-gray-700">
        Configure allowances for each <strong>Flute</strong>.{" "}
        <strong>Thickness</strong> is read-only and comes from the Flute/Thickness table.
        You can fill numbers later as you lock in your standards.
      </p>

      <PanelAllowanceEditor />
    </div>
  );
}
