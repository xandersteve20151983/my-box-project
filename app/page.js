// app/page.js  (SERVER)
export const dynamic = "force-dynamic";
export const revalidate = 0;

import PageClient from "./page.client";

export default function Page() {
  // Server just renders the client app; no props needed right now.
  return <PageClient />;
}
