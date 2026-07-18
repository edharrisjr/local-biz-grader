"use client";

import { useState, type ReactNode } from "react";
import { Loader2, Lock } from "lucide-react";
import type { Report } from "@/lib/types";

type Step = "phone" | "code" | "unlocked";

function storageKey(code: string): string {
  return `local-biz-grader:verified:${code}`;
}

export function ReportGate({ report, children }: { report: Report; children: ReactNode }) {
  const code = report.input.code;
  // Lazy initializer instead of an effect — safe because this component is
  // only ever rendered client-side (see the ssr:false dynamic import), so
  // there's no server-rendered markup to mismatch on hydration.
  const [step, setStep] = useState<Step>(() =>
    localStorage.getItem(storageKey(code)) === "true" ? "unlocked" : "phone"
  );
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/otp/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send code");
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckCode(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/otp/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otpCode, report }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        setError("That code didn't match — try again.");
        return;
      }
      localStorage.setItem(storageKey(code), "true");
      setStep("unlocked");
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative">
      <div className={step === "unlocked" ? "" : "pointer-events-none blur-md select-none"}>
        {children}
      </div>

      {step !== "unlocked" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#1a1a1a] sm:p-8">
            <div className="mb-4 flex flex-col items-center text-center">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/10">
                <Lock size={18} />
              </span>
              <h2 className="text-xl font-semibold">Unlock your free report</h2>
              <p className="mt-1 text-sm text-black/55 dark:text-white/55">
                {step === "phone"
                  ? "Enter your phone number and we'll text you a code to see your full results."
                  : `Enter the code we texted to ${phone}.`}
              </p>
            </div>

            {step === "phone" && (
              <form onSubmit={handleSendCode} className="space-y-3">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                  className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-transparent dark:focus:border-white/40"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-black"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? "Sending..." : "Send code"}
                </button>
              </form>
            )}

            {step === "code" && (
              <form onSubmit={handleCheckCode} className="space-y-3">
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full rounded-lg border border-black/15 px-3 py-2.5 text-center text-lg tracking-widest outline-none focus:border-black/40 dark:border-white/15 dark:bg-transparent dark:focus:border-white/40"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-black"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? "Verifying..." : "Verify & unlock"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="w-full text-center text-xs text-black/45 dark:text-white/40"
                >
                  Use a different number
                </button>
              </form>
            )}

            {error && <p className="mt-3 text-center text-sm text-red-500">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
