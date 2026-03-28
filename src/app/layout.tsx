import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ergon",
  description: "A platform for generative art",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-black">{children}</body>
    </html>
  );
}
