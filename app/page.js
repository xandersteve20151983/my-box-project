// app/page.js
// Server Component (no "use client" here)

import PalletisationPanel from "./components/pallets/PalletisationPanel.client";

export default function Page() {
  return (
    <main style={{ padding: 16 }}>
      <PalletisationPanel />
    </main>
  );
}
