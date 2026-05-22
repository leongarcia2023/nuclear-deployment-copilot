import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nuclear Deployment Intelligence Copilot",
  description: "Public-source-first nuclear deployment diligence workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
