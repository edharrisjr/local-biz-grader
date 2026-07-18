"use client";

import { useState } from "react";

function randomCode(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function PreviewLinkForm() {
  const [placeId, setPlaceId] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [link, setLink] = useState("");

  function generate(e: React.FormEvent) {
    e.preventDefault();
    const code = randomCode();
    const params = new URLSearchParams({
      placeid: placeId,
      name,
      lp: "homepage",
      grader_lp_variant: "champion",
    });
    if (city) params.set("city", city);

    setLink(`${window.location.origin}/${code}/scan?${params.toString()}`);
  }

  return (
    <form onSubmit={generate} className="w-full space-y-3">
      <input
        value={placeId}
        onChange={(e) => setPlaceId(e.target.value)}
        placeholder="Google Place ID (e.g. ChIJ...)"
        required
        className="w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent"
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Business name"
        required
        className="w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent"
      />
      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="City (optional)"
        className="w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent"
      />
      <button
        type="submit"
        className="w-full rounded-md bg-black px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black"
      >
        Generate report link
      </button>
      {link && (
        <a href={link} className="block break-all rounded-md bg-black/5 p-3 text-sm text-blue-600 underline dark:bg-white/10 dark:text-blue-400">
          {link}
        </a>
      )}
    </form>
  );
}
