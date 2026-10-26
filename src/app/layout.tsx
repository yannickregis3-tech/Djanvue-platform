import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "DJANVUƐ — Le monde est plus proche", description: "Un espace social et cloud pour les idées, les communautés et les opportunités.", applicationName: "DJANVUƐ" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f5f7f2" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="fr"><body>{children}</body></html>; }
