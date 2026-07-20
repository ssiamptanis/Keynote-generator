import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Keynote Generator | GWI",
  description: "Turn a Google Doc into a keynote-style presentation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
