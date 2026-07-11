import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { DocsShell } from "@/components/docs/shell";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mocko.dev/docs"),
  title: {
    default: "Mocko Docs",
    template: "%s | Mocko Docs",
  },
  description:
    "Documentation for Mocko, the dynamic HTTP mocking tool for local development, self-hosting, and Mocko Cloud.",
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    siteName: "Mocko Docs",
    locale: "en_US",
    url: "./",
    images: [
      {
        url: "https://cdn.codetunnel.net/mocko/og-v1.png",
        width: 1200,
        height: 630,
        alt: "Mocko – Dynamic HTTP mocking tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@mockoapp",
  },
  icons: {
    icon: "https://cdn.codetunnel.net/mocko/icon.png",
    shortcut: "https://cdn.codetunnel.net/mocko/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full dark`}>
      <body className="h-full bg-background text-foreground antialiased">
        <DocsShell>{children}</DocsShell>
      </body>
    </html>
  );
}
