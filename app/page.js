// app/page.js
// Server Component
import BoxPreview from "./components/BoxPreview";
import Link from "next/link";

export default function Page() {
  // very light server-side defaults; BoxPreview is the client brain
  const defaultDims = {
    L: 267, // mm
    W: 120,
    H: 80,
    flute: "B",
    t: 3,          // board caliper (approx) in mm
    slot: 9,       // slot (mm)
    topInnerGap: 144, // “flap gap (Top Inner)” from your UI
    style: "0201",
  };

  return (
    <main className="max-w-6xl mx-auto p-4">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Stephen’s Box Tool 🚀</h1>
        <Link href="/admin" className="text-blue-600 hover:underline">
          Admin →
        </Link>
      </header>

      {/* Top summary like your screenshot */}
      <section className="mb-4">
        <div className="rounded border p-4">
          <div className="text-sm opacity-80 mb-2">
            <span>Using FF Length: <b>393</b> mm,&nbsp;</span>
            <span>FF Width: <b>208</b> mm</span>
          </div>

          {/* 2D preview (client) */}
          <BoxPreview initial={defaultDims} />
        </div>
      </section>
    </main>
  );
}
