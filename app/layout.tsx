import type { Metadata } from "next";

import "../src/style.css";

export const metadata: Metadata = {
  title: "Lakkar Home — Furniture for the way you live",
  description:
    "Discover tables, seating, beds, and distinctive furniture at Lakkar Home. Browse the collection and order with cash on delivery.",
  icons: { icon: "/logo.jpeg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
