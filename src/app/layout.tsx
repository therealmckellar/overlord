import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent OS — Overlord",
  description: "Unified agent control plane for Rich's businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" data-theme="dark">
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--text)] font-[var(--font-sans)]">
        {children}
      </body>
    </html>
  );
}
