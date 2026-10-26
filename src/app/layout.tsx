import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "DJANVUƐ — votre univers, vos connexions", description: "DJANVUƐ réunit les publications, les communautés et les espaces de création.", applicationName: "DJANVUƐ" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f6f8f9" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="fr"><body>{children}</body></html>; }
