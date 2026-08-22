import { Badge } from "@/components/ui";

export function UserStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge tone={isActive ? "success" : "neutral"} dot>
      {isActive ? "ACTIVE" : "INACTIVE"}
    </Badge>
  );
}
