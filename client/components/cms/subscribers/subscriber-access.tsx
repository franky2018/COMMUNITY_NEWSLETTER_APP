import Link from "next/link";

type SubscriberNoAccessProps = {
  title?: string;
  description?: string;
};

export function SubscriberNoAccess({
  title = "You don’t have permission to manage subscribers.",
  description = "Subscribers are managed by editors and admins.",
}: SubscriberNoAccessProps) {
  return (
    <div className="mt-8 rounded-lg border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-600 dark:text-red-400">
      <p className="font-medium">{title}</p>
      <p className="mt-1">{description}</p>
      <Link href="/cms" className="mt-4 inline-block hover:underline">
        ← Back to dashboard
      </Link>
    </div>
  );
}
