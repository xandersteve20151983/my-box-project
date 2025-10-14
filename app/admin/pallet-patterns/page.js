export const metadata = {
  title: "Pallet Patterns | Admin",
};

const PATTERNS = [
  { code: "4B1", bundles: 4, img: "/pallets/4B1.png" },
  { code: "5B1", bundles: 5, img: "/pallets/5B1.png" },
  { code: "6B1", bundles: 6, img: "/pallets/6B1.png" },
  { code: "8B1", bundles: 8, img: "/pallets/8B1.png" },
  // add more as you digitize them
];

export default function AdminPalletPatterns() {
  return (
    <main className="p-6">
      <h1 className="text-lg font-semibold mb-4">Pallet Patterns</h1>
      <p className="text-sm text-gray-600 mb-6">
        Generic library (PNGs). Each shows pattern name & bundles per layer.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PATTERNS.map(p => (
          <article key={p.code} className="border rounded p-3">
            <div className="text-sm font-medium">{p.code}</div>
            <div className="text-xs text-gray-500 mb-2">
              {p.bundles} bundles/layer
            </div>
            <div className="h-40 bg-gray-50 border rounded grid place-items-center">
              {/* replace with <Image> once PNGs exist in /public/pallets */}
              <img
                src={p.img}
                alt={p.code}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
