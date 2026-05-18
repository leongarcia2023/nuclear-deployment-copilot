import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nuclear Deployment Intelligence Copilot",
  description: "Source-grounded counterparty and readiness diligence for nuclear deployment.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
