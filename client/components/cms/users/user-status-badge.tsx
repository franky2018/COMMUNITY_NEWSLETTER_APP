const ACTIVE_STYLE =
  "border-green-600/40 text-green-700 dark:border-green-500/40 dark:text-green-400";
const INACTIVE_STYLE = "border-black/15 text-zinc-500 dark:border-white/20 dark:text-zinc-500";

export function UserStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
        isActive ? ACTIVE_STYLE : INACTIVE_STYLE
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
