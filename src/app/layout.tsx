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
  --bg: #0d1117;
  --bg-secondary: #161b22;
  --bg-tertiary: #1c2333;
  --text: #e6edf3;
  --text-secondary: #8b949e;
  --text-muted: #484f58;
  --border: #30363d;
  --accent: #0ea5e9;
  --accent-hover: #38bdf8;
  --accent-muted: #0369a1;
  --success: #3fb950;
  --warning: #d29922;
  --error: #f85149;
  --info: #58a6ff;
  --user-bubble: #1c3a5e;
  --assistant-bubble: #161b22;
  --code-bg: #0d1117;
  --code-text: #c9d1d9;
  --shadow: rgba(0, 0, 0, 0.5);
  --overlay: rgba(0, 0, 0, 0.75);
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
