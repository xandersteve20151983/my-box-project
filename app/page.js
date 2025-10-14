// app/page.js (Server Component)
import Link from "next/link";
import BoxTool from "./BoxTool.client";

export default function Page() {
  return (
    <main className="max-w-6xl mx-auto p-4">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Stephen’s Box Tool 🚀</h1>
        <Link href="/admin" className="text-blue-600 hover:underline">Admin →</Link>
      </header>

      <section className="mb-4 rounded border p-4">
        <div className="text-sm opacity-80 mb-2">
          Using FF Length: <b>393</b> mm, FF Width: <b>208</b> mm
        </div>

        <BoxTool />
      </section>
    </main>
  );
}
