import type { Metadata } from "next";
import "./globals.css";
import AppTopBar from "@/components/AppTopBar";

export const metadata: Metadata = {
  title: "Hollow Cotizadores",
  description: "Sistema de cotización Hollow Mox",
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