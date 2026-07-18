import * as cheerio from "cheerio";
import type { ChecklistGroup, PlaceDetails } from "./types";

const PLATFORM_DOMAINS = [
  "wixsite.com",
  "squarespace.com",
  "weebly.com",
  "godaddysites.com",
  "business.site",
  "sites.google.com",
  "wordpress.com",
  "blogspot.com",
  "webs.com",
  "jimdo.com",
  "strikingly.com",
  "webflow.io",
  "carrd.co",
  "myshopify.com",
  "square.site",
  "ueniweb.com",
];

const SOCIAL_DOMAINS = [
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "tiktok.com",
  "youtube.com",
];

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

function keywordsFromCategory(category: string | undefined): string[] {
  if (!category) return [];
  return category
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3 && w !== "restaurant");
}

export function buildWebsiteChecklist(
  html: string | null,
  place: PlaceDetails,
  city: string | undefined
): ChecklistGroup[] | null {
  if (!place.website || html == null) return null;

  const $ = cheerio.load(html);
  const bodyText = $("body").text().replace(/\s+/g, " ").toLowerCase();
  const title = $("title").first().text().trim();
  const h1 = $("h1").first().text().trim();
  const metaDescription = $('meta[name="description"]').attr("content")?.trim() ?? "";
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  const ogDescription = $('meta[property="og:description"]').attr("content")?.trim();
  const ogImage = $('meta[property="og:image"]').attr("content")?.trim();
  const twitterCard = $('meta[name="twitter:card"]').attr("content")?.trim();
  const hasFavicon = $('link[rel="icon"], link[rel="shortcut icon"]').length > 0;

  const images = $("img");
  const imagesWithAlt = images.filter((_, el) => Boolean($(el).attr("alt")?.trim())).length;
  const totalImages = images.length;

  const hostname = hostnameOf(place.website);
  const isCustomDomain = !PLATFORM_DOMAINS.some((d) => hostname.endsWith(d));

  const hasSocialLink = SOCIAL_DOMAINS.some((d) =>
    $(`a[href*="${d}"]`).length > 0
  );

  const cityLower = city?.toLowerCase();
  const categoryKeywords = keywordsFromCategory(place.primaryCategory);
  const h1Lower = h1.toLowerCase();
  const titleLower = title.toLowerCase();

  const phoneDigits = place.phoneNumber ? digitsOnly(place.phoneNumber).slice(-10) : "";
  const phoneOnPage = phoneDigits ? digitsOnly(bodyText).includes(phoneDigits) : false;

  const streetLine = place.formattedAddress?.split(",")[0]?.trim().toLowerCase();
  const addressOnPage = streetLine ? bodyText.includes(streetLine) : false;

  return [
    {
      title: "Domain",
      items: [
        {
          id: "custom-domain",
          label: "Using a custom domain",
          passed: isCustomDomain,
          detail: hostname,
        },
        {
          id: "favicon",
          label: "Favicon set",
          passed: hasFavicon,
        },
      ],
    },
    {
      title: "Headline (H1)",
      items: [
        {
          id: "h1-exists",
          label: "Page has a headline",
          passed: h1.length > 0,
          detail: h1 || undefined,
        },
        {
          id: "h1-area",
          label: "Headline includes the service area",
          passed: Boolean(cityLower && h1Lower.includes(cityLower)),
        },
        {
          id: "h1-keyword",
          label: "Headline includes a relevant keyword",
          passed: categoryKeywords.some((k) => h1Lower.includes(k)),
        },
      ],
    },
    {
      title: "Metadata",
      items: [
        {
          id: "title-exists",
          label: "Page title exists",
          passed: title.length > 0,
          detail: title || undefined,
        },
        {
          id: "title-area",
          label: "Page title includes the service area",
          passed: Boolean(cityLower && titleLower.includes(cityLower)),
        },
        {
          id: "description-exists",
          label: "Meta description exists",
          passed: metaDescription.length > 0,
        },
        {
          id: "description-length",
          label: "Meta description is a sufficient length",
          passed: metaDescription.length >= 70,
        },
        {
          id: "og-title",
          label: "Open Graph title set",
          passed: Boolean(ogTitle),
        },
        {
          id: "og-description",
          label: "Open Graph description set",
          passed: Boolean(ogDescription),
        },
        {
          id: "og-image",
          label: "Open Graph image set",
          passed: Boolean(ogImage),
        },
        {
          id: "twitter-card",
          label: "Twitter card metadata set",
          passed: Boolean(twitterCard),
        },
      ],
    },
    {
      title: "Trust signals",
      items: [
        {
          id: "phone-on-page",
          label: "Phone number visible on the page",
          passed: phoneOnPage,
        },
        {
          id: "address-on-page",
          label: "Address visible on the page",
          passed: addressOnPage,
        },
        {
          id: "social-links",
          label: "Social media links present",
          passed: hasSocialLink,
        },
        {
          id: "alt-tags",
          label: "Images have alt tags",
          passed: totalImages === 0 || imagesWithAlt / totalImages >= 0.8,
          detail: totalImages > 0 ? `${imagesWithAlt}/${totalImages} images` : undefined,
        },
      ],
    },
  ];
}
