import type { ReactNode } from "react";
import { AdminTopBar } from "@/components/admin/top-bar";
import { requireStudioAdmin } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

export default async function StudioLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireStudioAdmin();

  return (
    <div className="pb-8">
      <AdminTopBar />
      {children}
    </div>
  );
}
