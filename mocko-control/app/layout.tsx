import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mocko",
  description: "Mocking made easy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <body className="h-full bg-background text-foreground antialiased">
        <TooltipProvider delay={300}>
          {children}
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
