import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Socratic — Learn Through Dialogue",
  description:
    "Upload your materials, name a topic, and be cross-examined by Socrates until you find the edges of what you actually know.",
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
