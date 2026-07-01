import type { Metadata } from "next";
import "./globals.css";
import GovernanceProvider from "@/components/GovernanceProvider";

export const metadata: Metadata = {
  title: "Agent OS — Overlord",
  description: "Unified agent control plane for Rich's businesses",
  manifest: "/manifest.json",
  themeColor: "#6366f1",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "Overlord — Agent OS",
    description: "Unified agent control plane for Rich's businesses",
    images: ["/logo.svg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Overlord",
  },
};

const criticalCSS = `
:root {
  --bg: #050505;
  --bg-secondary: #0c0c0c;
  --bg-tertiary: #141414;
  --text: #e8e8e8;
  --text-secondary: #a0a0a0;
  --text-muted: #666666;
  --border: #1f1f1f;
  --accent: #4f46e5;
  --accent-hover: #6366f1;
  --accent-muted: #3730a3;
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  --user-bubble: #1e1b4b;
  --assistant-bubble: #1a1a1a;
  --code-bg: #111111;
  --code-text: #c9d1d9;
  --shadow: rgba(0, 0, 0, 0.6);
  --overlay: rgba(0, 0, 0, 0.7);
  --background: var(--bg);
  --foreground: var(--text);
}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" data-theme="dark">
      <head>
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--text)] font-[var(--font-sans)]">
        <GovernanceProvider>
          {children}
        </GovernanceProvider>
      </body>
    </html>
  );
}
