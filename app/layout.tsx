import type { Metadata } from "next";
import "@fontsource/archivo/400.css";
import "@fontsource/archivo/600.css";
import "@fontsource/archivo/800.css";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/400-italic.css";
import "@fontsource/newsreader/500.css";
import "@fontsource/caveat/500.css";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "./globals.css";
import site from "@/content/site.json";

export const metadata: Metadata = {
  title: { default: `${site.name} Magazine`, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: { title: `${site.name} Magazine`, description: site.description, type: "website", locale: "fr_FR" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
