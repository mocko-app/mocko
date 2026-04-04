import { BottomTabBar } from "@/components/bottom-tab-bar";
import { Sidebar } from "@/components/sidebar";
import { Separator } from "@/components/ui/separator";

export default function MocksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      <Sidebar />
      <Separator
        orientation="vertical"
        className="hidden md:block bg-[#1c1c1e]"
        aria-hidden="true"
      />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <div className="mx-auto w-full max-w-3xl px-4 py-8">{children}</div>
      </main>
      <BottomTabBar />
    </div>
  );
}
