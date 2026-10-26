import type { Metadata, Viewport } from "next";
import { DesktopSidebar, MobileNav } from "@/components/navigation/AppNavigation";
import "./globals.css";
export const metadata: Metadata = { title: "DJANVUƐ — Un monde, plusieurs résonances", description: "DJANVUƐ réunit les échanges sociaux, les communautés et les espaces de création.", applicationName: "DJANVUƐ" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#101c1b" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="fr"><body><div className="djanvue-frame"><DesktopSidebar/><div className="djanvue-content">{children}</div><MobileNav/></div></body></html>; }
