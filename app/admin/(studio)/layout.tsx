import type { ReactNode } from "react";
import { NotesShell, type SidebarPursuit } from "@/components/admin/notes-shell";
import { requireStudioAdmin } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

export default async function StudioLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { supabase } = await requireStudioAdmin();
  const { data, error } = await supabase
    .from("pursuits")
    .select("id, title, is_published")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`读取追求失败：${error.message}`);

  return <NotesShell pursuits={(data ?? []) as SidebarPursuit[]}>{children}</NotesShell>;
}
