import type { UserRole } from "@/types/api";
import { Badge, type BadgeTone } from "@/components/ui";

const ROLE_TONES: Record<UserRole, BadgeTone> = {
  ADMIN: "primary",
  EDITOR: "success",
  AUTHOR: "neutral",
};

export function UserRoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge tone={ROLE_TONES[role]} dot>
      {role}
    </Badge>
  );
}
