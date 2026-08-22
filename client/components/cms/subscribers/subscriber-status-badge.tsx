import type { SubscriberStatus } from "@/types/api";
import { Badge, type BadgeTone } from "@/components/ui";

const STATUS_TONES: Record<SubscriberStatus, BadgeTone> = {
  ACTIVE: "success",
  UNSUBSCRIBED: "neutral",
};

export function SubscriberStatusBadge({ status }: { status: SubscriberStatus }) {
  return (
    <Badge tone={STATUS_TONES[status]} dot>
      {status}
    </Badge>
  );
}
