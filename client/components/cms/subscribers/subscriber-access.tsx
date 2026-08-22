import { AccessDenied } from "@/components/cms/access-denied";

type SubscriberNoAccessProps = {
  title?: string;
  description?: string;
};

export function SubscriberNoAccess({
  title = "You don’t have permission to manage subscribers.",
  description = "Subscribers are managed by editors and admins.",
}: SubscriberNoAccessProps) {
  return (
    <AccessDenied
      title={title}
      description={description}
      backHref="/cms"
      backLabel="Back to dashboard"
    />
  );
}
