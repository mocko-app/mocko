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
        className="bg-[#1c1c1e]"
        aria-hidden="true"
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
