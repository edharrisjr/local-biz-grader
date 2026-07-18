"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Check, Crown, Search, Sparkle } from "lucide-react";
import type { PlacePrediction } from "@/lib/types";

const SUGGESTION_CHIPS = [
  { icon: Search, label: "How's my Google listing?" },
  { icon: Sparkle, label: "What's broken on my site?" },
  { icon: Crown, label: "Who's beating me and how?" },
];

function randomCode(): string {
  return Math.random().toString(36).slice(2, 10);
}

function websiteLabel(url: string | null): string {
  if (!url) return "Checking for a website";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function buildSteps(businessLabel: string, website: string | null) {
  return [
    { id: "business", label: businessLabel },
    { id: "gbp", label: "Google Business Profile" },
    { id: "reviews", label: "Reviews & ratings" },
    { id: "website", label: websiteLabel(website) },
    { id: "ordering", label: "Online ordering & booking" },
    { id: "localSeo", label: "Local SEO signals" },
  ];
}

const STEP_DURATION_MS = 1150;

export function ScanIntro() {
  const router = useRouter();
  const [phase, setPhase] = useState<"search" | "scanning">("search");
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [selected, setSelected] = useState<PlacePrediction | null>(null);
  const [website, setWebsite] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(-1);
  const [secondsRemaining, setSecondsRemaining] = useState(7);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/autocomplete?input=${encodeURIComponent(query)}`);
        const data = await res.json();
        setPredictions(data.predictions ?? []);
      } catch {
        setPredictions([]);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function selectPrediction(prediction: PlacePrediction) {
    setSelected(prediction);
    setQuery(prediction.mainText);
    setShowPredictions(false);
    setPhase("scanning");
  }

  useEffect(() => {
    if (phase !== "scanning" || !selected) return;

    let cancelled = false;
    fetch(`/api/place-preview?placeId=${encodeURIComponent(selected.placeId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setWebsite(data.website ?? null);
      })
      .catch(() => {});

    const stepCount = 6;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    // Runs to stepCount (inclusive) so the final step also gets to show its
    // checkmark before redirecting, instead of staying on its spinner.
    for (let i = 0; i <= stepCount; i++) {
      timeouts.push(setTimeout(() => setActiveStep(i), i * STEP_DURATION_MS));
    }

    const interval = setInterval(() => {
      setSecondsRemaining((s) => Math.max(0, s - 1));
    }, 1000);

    const redirect = setTimeout(() => {
      const params = new URLSearchParams({
        placeid: selected.placeId,
        name: selected.mainText,
        lp: "homepage",
        grader_lp_variant: "champion",
      });
      const city = selected.secondaryText.split(",")[1]?.trim();
      if (city) params.set("city", city);
      router.push(`/${randomCode()}/scan?${params.toString()}`);
    }, (stepCount + 1) * STEP_DURATION_MS + 400);

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
      clearInterval(interval);
      clearTimeout(redirect);
    };
  }, [phase, selected, router]);

  if (phase === "scanning" && selected) {
    const steps = buildSteps(selected.mainText, website);
    return (
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-16 px-6 py-16 lg:flex-row lg:gap-24">
        <div className="w-full max-w-sm">
          <h2 className="mb-6 text-2xl font-bold text-[#123524]">Scanning...</h2>
          <ol className="space-y-4">
            {steps.map((step, i) => {
              const active = i === activeStep;
              const pending = i > activeStep;
              return (
                <li key={step.id} className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs transition-colors ${
                      pending
                        ? "border border-black/15 text-transparent"
                        : "bg-[#123524] text-white"
                    }`}
                  >
                    {!pending && (active ? <Loader /> : <Check size={13} strokeWidth={3} />)}
                  </span>
                  <span
                    className={`text-sm ${pending ? "text-black/35" : "font-medium text-[#123524]"}`}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
          <div className="mt-10 flex items-center gap-3 rounded-xl bg-black/[0.03] px-4 py-3">
            <Loader />
            <span className="text-sm font-medium text-[#123524]">
              {secondsRemaining} second{secondsRemaining === 1 ? "" : "s"} remaining
            </span>
          </div>
        </div>

        <BrowserMockup />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <div className="max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight text-[#123524] sm:text-4xl">
          Enter your business name to see your online health score
        </h1>
        <p className="mt-3 text-black/50">
          Scan your listing in seconds and see exactly what&apos;s costing you customers.
        </p>
      </div>

      <div className="relative w-full max-w-xl">
        <div className="flex items-center rounded-2xl bg-black/5 p-2 pl-5">
          <input
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              setShowPredictions(true);
              if (value.trim().length < 2) setPredictions([]);
            }}
            onFocus={() => setShowPredictions(true)}
            placeholder="Find your business"
            className="flex-1 bg-transparent py-3 text-black/80 outline-none placeholder:text-black/40"
          />
          <button
            type="button"
            disabled={!predictions.length}
            onClick={() => predictions[0] && selectPrediction(predictions[0])}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#123524] text-white transition-opacity disabled:opacity-40"
            aria-label="Search"
          >
            <ArrowUp size={18} />
          </button>
        </div>

        {showPredictions && predictions.length > 0 && (
          <ul className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-black/10 bg-[#FAF6EF] text-left shadow-lg">
            {predictions.map((p) => (
              <li key={p.placeId}>
                <button
                  type="button"
                  onClick={() => selectPrediction(p)}
                  className="block w-full px-5 py-3 text-left hover:bg-[#123524] hover:text-white"
                >
                  <span className="block font-semibold">{p.mainText}</span>
                  <span className="block text-sm opacity-70">{p.secondaryText}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {SUGGESTION_CHIPS.map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            onClick={() => document.querySelector("input")?.focus()}
            className="flex items-center gap-2 rounded-full bg-black/5 px-4 py-2 text-sm font-medium text-black/70 transition-colors hover:bg-black/10"
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Loader() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin text-[#123524]" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function BrowserMockup() {
  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-600/60 to-transparent blur-[1px]" />
      <div className="absolute inset-x-10 -bottom-4 h-8 rounded-full bg-emerald-500/20 blur-2xl" />
      <div className="relative overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl">
        <div className="flex items-center gap-1.5 border-b border-black/5 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="relative h-72 bg-gradient-to-b from-black/[0.02] to-transparent">
          <div className="animate-scan-sweep absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent" />
        </div>
      </div>
    </div>
  );
}
