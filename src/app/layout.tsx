import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MIG Export",
  description: "Sistema de estado de resultados para exportación de cardamomo",
  openGraph: {
    title: "MIG Export",
    description: "Estado de resultados — Exportación de cardamomo",
    siteName: "MIG Export",
    locale: "es_GT",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "MIG Export — Estado de resultados para exportación de cardamomo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MIG Export",
    description: "Estado de resultados — Exportación de cardamomo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
