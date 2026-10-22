import type { Metadata } from "next";

import "../src/style.css";

export const metadata: Metadata = {
  title: "Lakkar Home — Objects for everyday living",
  description:
    "Discover wooden homewares at Lakkar Home. Browse the collection and order with cash on delivery.",
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
