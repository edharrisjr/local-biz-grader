import { PreviewLinkForm } from "@/components/PreviewLinkForm";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-bold">Local Biz Grader</h1>
        <p className="mt-2 text-sm text-black/60 dark:text-white/60">
          Internal tool for generating one-off audit report links during QA.
          For bulk cold-outreach link generation, use{" "}
          <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">
            npm run generate-links -- prospects.csv
          </code>
          .
        </p>
      </div>
      <PreviewLinkForm />
    </main>
  );
}
