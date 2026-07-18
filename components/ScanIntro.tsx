"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  BadgeCheck,
  Check,
  Crown,
  ImageOff,
  MapPin,
  Search,
  ShoppingCart,
  Sparkle,
  Star,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { PlacePrediction, PlaceReview } from "@/lib/types";

const SUGGESTION_CHIPS = [
  { icon: Search, label: "How's my Google listing?" },
  { icon: Sparkle, label: "What's broken on my site?" },
  { icon: Crown, label: "Who's beating me and how?" },
];

interface PlacePreview {
  name: string | null;
  website: string | null;
  rating: number | null;
  userRatingCount: number | null;
  photoCount: number;
  primaryCategory: string | null;
  formattedAddress: string | null;
  reviews: PlaceReview[];
  photoNames: string[];
  priceLevel: string | null;
  description: string | null;
  location: { lat: number; lng: number } | null;
}

const PRICE_LEVEL_SYMBOLS: Record<string, string> = {
  PRICE_LEVEL_FREE: "Free",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
};

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
    { id: "photos", label: "Photo quality and quantity" },
    { id: "website", label: websiteLabel(website) },
    { id: "ordering", label: "Online ordering & booking" },
    { id: "localSeo", label: "Local SEO signals" },
  ] as const;
}

const STEP_DURATION_MS = 1400;

export function ScanIntro() {
  const router = useRouter();
  const [phase, setPhase] = useState<"search" | "scanning">("search");
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [selected, setSelected] = useState<PlacePrediction | null>(null);
  const [preview, setPreview] = useState<PlacePreview | null>(null);
  const [activeStep, setActiveStep] = useState(-1);
  const [secondsRemaining, setSecondsRemaining] = useState(8);
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
        if (!cancelled) setPreview(data);
      })
      .catch(() => {});

    const stepCount = 7;
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
    const steps = buildSteps(selected.mainText, preview?.website ?? null);
    const currentStepId = steps[activeStep]?.id;

    return (
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-16 px-6 py-16 lg:flex-row lg:items-start lg:gap-24">
        <div className="w-full max-w-sm lg:pt-16">
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

        <div key={currentStepId} className="animate-fade-in-up w-full max-w-md">
          {currentStepId === "business" ? (
            <BusinessFoundCard name={selected.mainText} address={selected.secondaryText} />
          ) : currentStepId === "reviews" && preview?.reviews.length ? (
            <ReviewsPanel reviews={preview.reviews} />
          ) : currentStepId === "gbp" && preview ? (
            <GbpCard preview={preview} />
          ) : currentStepId === "photos" ? (
            <PhotosPanel names={preview?.photoNames ?? []} count={preview?.photoCount ?? 0} />
          ) : currentStepId === "website" ? (
            <BrowserMockup url={preview?.website ?? null} />
          ) : currentStepId === "ordering" ? (
            <OrderingCheckCard />
          ) : currentStepId === "localSeo" ? (
            <LocalSeoCheckCard category={preview?.primaryCategory ?? null} />
          ) : (
            <BrowserMockup url={null} />
          )}
        </div>
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

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-black/10 text-black/10"}
        />
      ))}
    </div>
  );
}

function ReviewAvatar({ name, photoUrl }: { name: string; photoUrl?: string }) {
  const [errored, setErrored] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (photoUrl && !errored) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external Google-hosted avatar, not worth remotePatterns config
      <img
        src={photoUrl}
        alt=""
        width={36}
        height={36}
        onError={() => setErrored(true)}
        className="h-9 w-9 shrink-0 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#123524] text-sm font-semibold text-white">
      {initial}
    </span>
  );
}

function ReviewsPanel({ reviews }: { reviews: PlaceReview[] }) {
  return (
    <div className="max-h-[32rem] space-y-3 overflow-hidden">
      {reviews.map((review, i) => (
        <div
          key={i}
          className="animate-fade-in-up rounded-xl border border-black/10 bg-white p-4 shadow-sm"
          style={{ animationDelay: `${i * 0.12}s` }}
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ReviewAvatar name={review.authorName} photoUrl={review.authorPhotoUrl} />
              <div>
                <p className="text-sm font-semibold text-black/85">{review.authorName}</p>
                <p className="text-xs text-black/40">{review.relativeTime}</p>
              </div>
            </div>
            <StarRow rating={review.rating} />
          </div>
          <p className="line-clamp-2 text-sm text-black/65">{review.text}</p>
        </div>
      ))}
    </div>
  );
}

function PhotoThumb({ name }: { name: string }) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-black/5 text-black/25">
        <ImageOff size={18} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- proxied Google photo, size varies per source image
    <img
      src={`/api/place-photo?name=${encodeURIComponent(name)}`}
      alt=""
      onError={() => setErrored(true)}
      className="aspect-square w-full rounded-lg object-cover"
    />
  );
}

function PhotosPanel({ names, count }: { names: string[]; count: number }) {
  if (names.length === 0) {
    return (
      <CheckingCard
        icon={ImageOff}
        title="Checking listing photos"
        subtitle={count ? `${count} photos on file` : "Looking for photos on the profile"}
      />
    );
  }

  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-3 gap-2">
        {names.map((name, i) => (
          <div key={name} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
            <PhotoThumb name={name} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-black/45">{count} photos on the listing</p>
    </div>
  );
}

function GbpCard({ preview }: { preview: PlacePreview }) {
  const price = preview.priceLevel ? PRICE_LEVEL_SYMBOLS[preview.priceLevel] : null;
  const firstPhoto = preview.photoNames[0];

  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
      {(firstPhoto || preview.location) && (
        <div className="flex h-36 gap-0.5">
          {firstPhoto && (
            // eslint-disable-next-line @next/next/no-img-element -- proxied Google photo
            <img
              src={`/api/place-photo?name=${encodeURIComponent(firstPhoto)}`}
              alt=""
              className="h-full w-1/3 object-cover"
            />
          )}
          {preview.location && (
            // eslint-disable-next-line @next/next/no-img-element -- proxied Maps Static image
            <img
              src={`/api/place-map?lat=${preview.location.lat}&lng=${preview.location.lng}`}
              alt="Map"
              className={`h-full object-cover ${firstPhoto ? "w-2/3" : "w-full"}`}
            />
          )}
        </div>
      )}

      <div className="p-5">
        <p className="font-semibold text-black/85">{preview.name}</p>

        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          {preview.rating != null && (
            <>
              <StarRow rating={preview.rating} />
              <span className="text-sm text-black/60">{preview.rating.toFixed(1)}</span>
            </>
          )}
          {preview.primaryCategory && (
            <>
              <span className="text-black/25">|</span>
              <span className="text-sm text-black/50">{preview.primaryCategory}</span>
            </>
          )}
          {price && (
            <>
              <span className="text-black/25">|</span>
              <span className="text-sm text-black/50">{price}</span>
            </>
          )}
        </div>

        {preview.description && (
          <p className="mb-2 line-clamp-2 text-sm text-black/55">{preview.description}</p>
        )}
        {preview.formattedAddress && (
          <p className="text-sm text-black/45">{preview.formattedAddress}</p>
        )}
      </div>
    </div>
  );
}

function BusinessFoundCard({ name, address }: { name: string; address: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <span className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-lg bg-emerald-500/20" />
          <MapPin size={18} className="relative" />
        </span>
        <div>
          <p className="font-semibold text-black/85">{name}</p>
          <p className="text-sm text-black/45">{address}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
        <BadgeCheck size={16} />
        Match confirmed on Google
      </div>
    </div>
  );
}

function CheckingCard({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700">
          <Icon size={18} />
        </span>
        <div>
          <p className="font-semibold text-black/85">{title}</p>
          {subtitle && <p className="text-sm text-black/45">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-black/50">
        <Loader />
        Analyzing...
      </div>
    </div>
  );
}

function OrderingCheckCard() {
  return (
    <CheckingCard
      icon={ShoppingCart}
      title="Checking for online ordering & booking"
      subtitle="ChowNow, Toast, OpenTable, Resy, and more"
    />
  );
}

function LocalSeoCheckCard({ category }: { category: string | null }) {
  return (
    <CheckingCard
      icon={TrendingUp}
      title="Analyzing local search visibility"
      subtitle={category ? `Ranking signals for "${category}"` : "Category, citations, and listing signals"}
    />
  );
}

function BrowserMockup({ url }: { url?: string | null }) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-600/60 to-transparent blur-[1px]" />
      <div className="absolute inset-x-10 -bottom-4 h-8 rounded-full bg-emerald-500/20 blur-2xl" />
      <div className="relative overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl">
        <div className="flex items-center gap-3 border-b border-black/5 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          {url && (
            <span className="truncate rounded-md bg-black/[0.04] px-2.5 py-1 text-xs text-black/45">
              {websiteLabel(url)}
            </span>
          )}
        </div>
        <div className="relative h-72 bg-gradient-to-b from-black/[0.02] to-transparent">
          {url ? (
            <iframe
              src={url}
              title="Website preview"
              className="pointer-events-none h-full w-full border-0"
              sandbox="allow-scripts allow-same-origin"
              loading="eager"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Loader />
            </div>
          )}
          <div className="animate-scan-sweep absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent" />
        </div>
      </div>
    </div>
  );
}
