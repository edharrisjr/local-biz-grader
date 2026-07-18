"use client";

import { useState } from "react";
import type { Report } from "@/lib/types";

export function LeadForm({ report }: { report: Report }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report,
          firstName: form.get("firstName"),
          lastName: form.get("lastName"),
          email: form.get("email"),
          phone: form.get("phone"),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <p className="font-semibold">Thanks — we&apos;ll be in touch shortly.</p>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          A copy of this audit and next steps are on their way.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-black/10 p-6 dark:border-white/10">
      <h3 className="font-semibold">Want the full breakdown and a free fix-it plan?</h3>
      <div className="grid grid-cols-2 gap-3">
        <input name="firstName" placeholder="First name" required className="rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent" />
        <input name="lastName" placeholder="Last name" className="rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent" />
      </div>
      <input name="email" type="email" placeholder="Email" required className="w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent" />
      <input name="phone" type="tel" placeholder="Phone (optional)" className="w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent" />
      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-md bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {status === "submitting" ? "Sending..." : "Get my free consultation"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-500">{errorMessage || "Submission failed — try again."}</p>
      )}
    </form>
  );
}
