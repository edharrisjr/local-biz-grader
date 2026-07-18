"use client";

import { useState } from "react";
import { CalendarCheck, CircleCheck, Loader2 } from "lucide-react";
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
      <div className="animate-fade-in-up rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-8 text-center">
        <CircleCheck className="mx-auto mb-3 text-emerald-500" size={32} strokeWidth={1.75} />
        <p className="font-semibold">Thanks — we&apos;ll be in touch shortly.</p>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          A copy of this audit and next steps are on their way.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-fade-in-up space-y-4 rounded-2xl border border-black/10 p-6 shadow-sm sm:p-8 dark:border-white/10"
      style={{ animationDelay: "0.6s" }}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/5 dark:bg-white/10">
          <CalendarCheck size={18} />
        </span>
        <div>
          <h3 className="font-semibold">Want the full breakdown and a free fix-it plan?</h3>
          <p className="text-sm text-black/55 dark:text-white/55">
            15 minutes, no pressure — we&apos;ll walk through exactly what to fix first.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input
          name="firstName"
          placeholder="First name"
          required
          className="rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none transition-colors focus:border-black/40 dark:border-white/15 dark:bg-transparent dark:focus:border-white/40"
        />
        <input
          name="lastName"
          placeholder="Last name"
          className="rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none transition-colors focus:border-black/40 dark:border-white/15 dark:bg-transparent dark:focus:border-white/40"
        />
      </div>
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none transition-colors focus:border-black/40 dark:border-white/15 dark:bg-transparent dark:focus:border-white/40"
      />
      <input
        name="phone"
        type="tel"
        placeholder="Phone (optional)"
        className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none transition-colors focus:border-black/40 dark:border-white/15 dark:bg-transparent dark:focus:border-white/40"
      />
      <button
        type="submit"
        disabled={status === "submitting"}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {status === "submitting" && <Loader2 size={16} className="animate-spin" />}
        {status === "submitting" ? "Sending..." : "Get my free consultation"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-500">{errorMessage || "Submission failed — try again."}</p>
      )}
    </form>
  );
}
