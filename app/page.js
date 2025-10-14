// app/page.js
import PalletisationPanel from "./components/pallets/PalletisationPanel.client";

const ffLength = 393;
const ffWidth  = 208;

export default function Home() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-lg font-semibold">Home</h1>

      <section className="border rounded p-4">
        <PalletisationPanel ffLength={ffLength} ffWidth={ffWidth} />
      </section>
    </main>
  );
}
