import type { UserRole } from "@/types/api";

const ROLE_STYLES: Record<UserRole, string> = {
  ADMIN: "border-violet-500/40 text-violet-700 dark:border-violet-500/40 dark:text-violet-400",
  EDITOR: "border-blue-500/40 text-blue-700 dark:border-blue-500/40 dark:text-blue-400",
  AUTHOR: "border-black/15 text-zinc-600 dark:border-white/20 dark:text-zinc-400",
};

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  AUTHOR: "Author",
};

export function UserRoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${ROLE_STYLES[role]}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
