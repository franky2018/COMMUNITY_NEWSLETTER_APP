import { Suspense } from "react";

import { UnsubscribePanel } from "@/components/public/unsubscribe-panel";

export default function UnsubscribePage() {
  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <Suspense fallback={<div className="text-sm text-muted">Loading…</div>}>
        <UnsubscribePanel />
      </Suspense>
    </section>
  );
}
