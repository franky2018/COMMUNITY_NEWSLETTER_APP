export default function CmsHomePage() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-3xl">
        <h1 className="text-2xl font-semibold">CMS</h1>
        <p className="mt-2 text-sm text-zinc-600">
          The CMS dashboard is intentionally not implemented yet. This route group is
          protected by middleware and will host the admin UI.
        </p>
      </div>
    </main>
  );
}
