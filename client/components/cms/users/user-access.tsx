import { AccessDenied } from "@/components/cms/access-denied";

type UserNoAccessProps = {
  title?: string;
  description?: string;
};

export function UserNoAccess({
  title = "You don't have permission to manage users.",
  description = "User management is restricted to administrators.",
}: UserNoAccessProps) {
  return (
    <AccessDenied
      title={title}
      description={description}
      backHref="/cms"
      backLabel="Back to dashboard"
    />
  );
}
