import { Badge, type BadgeTone } from "@/components/ui";
import type { NewsletterStatus } from "@/types/api";

const STATUS_TONES: Record<NewsletterStatus, BadgeTone> = {
  DRAFT: "warning",
  PUBLISHED: "success",
  ARCHIVED: "neutral",
};

export function NewsletterStatusBadge({ status }: { status: NewsletterStatus }) {
  return (
    <Badge tone={STATUS_TONES[status]} dot>
      {status}
    </Badge>
  );
}
