// app/admin/pallets/page.js
import PalletTable from "./table.client";

export default function Page() {
  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pallets</h1>
      </header>

      <p className="text-sm text-gray-600">
        Define standard pallets (size, deck type, height, weight). Dimensions are in millimetres, weight in kilograms.
      </p>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <PalletTable />
        </div>

        <aside className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Fork entry / orientation</h2>
          <p className="mb-3 text-sm text-gray-600">
            Length is measured along the fork-entry direction. Width is the cross-fork direction. Height is the overall pallet height.
          </p>
          <img
            src="/pallets/fork-orientation.svg"
            alt="Fork entry versus across pallet"
            className="w-full h-auto"
          />
        </aside>
      </section>
    </div>
  );
}
