import { PreviewLinkForm } from "@/components/PreviewLinkForm";

export default function ToolsPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-bold">Internal Tools</h1>
        <p className="mt-2 text-sm text-black/60 dark:text-white/60">
          Generate a one-off audit report link during QA without going through
          the search flow. For bulk cold-outreach link generation, use{" "}
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
