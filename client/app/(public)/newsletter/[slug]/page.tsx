type NewsletterPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function NewsletterPage({ params }: NewsletterPageProps) {
  const { slug } = await params;

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-3xl">
        <h1 className="text-2xl font-semibold">Newsletter: {slug}</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Newsletter content UI is intentionally not implemented yet.
        </p>
      </div>
    </main>
  );
}
