import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mocko – Mocking made easy",
  description:
    "Mocking made easy, proxy your API and choose which endpoints to mock",
  themeColor: "#25d278",
  icons: {
    icon: "https://cdn.codetunnel.net/mocko/icon.png",
    shortcut: "https://cdn.codetunnel.net/mocko/icon.png",
    apple: "https://cdn.codetunnel.net/mocko/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <body className="h-full bg-background text-foreground antialiased">
        <TooltipProvider delay={300}>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
