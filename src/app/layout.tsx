import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent OS — Overlord",
  description: "Unified agent control plane for Rich's businesses",
};

const criticalCSS = `
:root {
  --bg: #0d0d0d;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #242424;
  --text: #e8e8e8;
  --text-secondary: #a0a0a0;
  --text-muted: #666666;
  --border: #2a2a2a;
  --accent: #6366f1;
  --accent-hover: #818cf8;
  --accent-muted: #4338ca;
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  --user-bubble: #1e1b4b;
  --assistant-bubble: #1a1a1a;
  --code-bg: #111111;
  --code-text: #c9d1d9;
  --shadow: rgba(0, 0, 0, 0.4);
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
        {children}
      </body>
    </html>
  );
}
