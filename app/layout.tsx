import type { Metadata } from "next";
import "./globals.css";
import AppTopBar from "@/components/AppTopBar";

export const metadata: Metadata = {
  title: "Hollow Cotizadores",
  description: "Sistema de cotización Hollow Mox",
  icons: {
    icon: "/void-warlock.svg",
    shortcut: "/void-warlock.svg",
    apple: "/void-warlock.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-neutral-950">
        <AppTopBar />
        {children}
      </body>
    </html>
  );
}