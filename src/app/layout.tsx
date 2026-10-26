import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "DJANVUƐ — votre univers social", description: "Publiez, échangez, créez et retrouvez vos communautés sur DJANVUƐ.", applicationName: "DJANVUƐ" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b1117" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
