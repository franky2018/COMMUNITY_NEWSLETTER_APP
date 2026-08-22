import { PublicFooter } from "@/components/public/footer";
import { PublicHeader } from "@/components/public/header";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-canvas">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
