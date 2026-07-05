import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mocko Docs",
    template: "%s | Mocko Docs",
  },
  description:
    "Documentation for Mocko, the dynamic HTTP mocking tool for local development, self-hosting, and Mocko Cloud.",
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
        {children}
      </body>
    </html>
  );
}
