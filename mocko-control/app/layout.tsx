import type { Metadata, Viewport } from "next";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { Sidebar } from "@/components/sidebar";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mocko – Mocking made easy",
  description:
    "Mocking made easy, proxy your API and choose which endpoints to mock",
  icons: {
    icon: "https://cdn.codetunnel.net/mocko/icon.png",
    shortcut: "https://cdn.codetunnel.net/mocko/icon.png",
    apple: "https://cdn.codetunnel.net/mocko/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#25d278",
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
          <div className="flex h-full">
            <Sidebar />
            <Separator
              orientation="vertical"
              className="hidden md:block bg-[#1c1c1e]"
              aria-hidden="true"
            />
            <main className="flex-1 overflow-auto pb-16 md:pb-0">
              <div className="mx-auto w-full max-w-3xl px-4 py-8">
                {children}
              </div>
            </main>
            <BottomTabBar />
          </div>
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
