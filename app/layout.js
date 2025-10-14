import "./globals.css";

export const metadata = {
  title: "Stephen's Box Tool",
  description: "Box calculator",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
