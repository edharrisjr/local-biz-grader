import * as cheerio from "cheerio";
import type { ChecklistGroup, OrderingSignals, PlaceDetails } from "./types";

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

/** Big third-party marketplaces that take a cut of every order. */
const MARKETPLACE_DOMAINS = [
  "doordash.com",
  "ubereats.com",
  "grubhub.com",
  "slice.com",
  "seamless.com",
  "postmates.com",
  "caviar.com",
  "instacart.com",
];

/** Broader set of external ordering systems (marketplaces + white-label
 *  ordering SaaS) — a link to any of these off the site's own domain means
 *  ordering doesn't happen "on-site". */
const EXTERNAL_ORDERING_DOMAINS = [
  ...MARKETPLACE_DOMAINS,
  "chownow.com",
  "toasttab.com",
  "olo.com",
  "clover.com",
  "order.online",
  "ezcater.com",
];

const ORDER_CTA_PHRASES = [
  "order online",
  "order now",
  "place an order",
  "submit an order",
  "online ordering",
  "get delivery",
];

const DIRECT_ORDER_BENEFIT_PHRASES = [
  "save on fees",
  "no delivery fees",
  "no service fees",
  "skip the fees",
  "order direct and save",
  "avoid third-party fees",
  "save money by ordering direct",
];

const MIN_TEXT_WORDS = 150;
const MIN_DESCRIPTION_LENGTH = 100;

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

export interface WebsiteAnalysis {
  hostname: string;
  isCustomDomain: boolean;
  hasFavicon: boolean;
  h1: string;
  title: string;
  metaDescription: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  altTagRatio: number | null;
  totalImages: number;
  imagesWithAlt: number;
  phoneOnPage: boolean;
  addressOnPage: boolean;
  socialLinks: string[];
  wordCount: number;
  avgWordsPerSentence: number;
  hasExternalOrderingLink: boolean;
  externalOrderingHref: string | null;
  hasMarketplaceLink: boolean;
  hasOrderCta: boolean;
  hasAboutSection: boolean;
  hasReviewsSection: boolean;
  hasFaqSection: boolean;
  explainsDirectOrderingBenefits: boolean;
  categoryKeywords: string[];
  cityLower: string | null;
}

/**
 * Parses the site's homepage HTML exactly once; the result feeds the SEO
 * Content, Guest Experience, and Local Listings checklists so none of them
 * has to re-parse the same document.
 */
export function analyzeWebsite(
  html: string | null,
  place: PlaceDetails,
  city: string | undefined
): WebsiteAnalysis | null {
  if (!place.website || html == null) return null;
  return analyzeWebsiteHtml(html, place, city);
}

function analyzeWebsiteHtml(
  html: string,
  place: PlaceDetails,
  city: string | undefined
): WebsiteAnalysis {
  const $ = cheerio.load(html);
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const bodyTextLower = bodyText.toLowerCase();
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

  const hostname = place.website ? hostnameOf(place.website) : "";
  const isCustomDomain = !PLATFORM_DOMAINS.some((d) => hostname.endsWith(d));

  const links = $("a[href]");
  const socialLinks = new Set<string>();
  let hasExternalOrderingLink = false;
  let externalOrderingHref: string | null = null;
  let hasMarketplaceLink = false;

  links.each((_, el) => {
    const href = $(el).attr("href");
    if (!href || !href.startsWith("http")) return;
    const linkHost = hostnameOf(href);
    if (!linkHost) return;

    if (SOCIAL_DOMAINS.some((d) => linkHost === d || linkHost.endsWith(`.${d}`))) {
      socialLinks.add(href);
    }
    if (linkHost !== hostname) {
      if (
        !hasExternalOrderingLink &&
        EXTERNAL_ORDERING_DOMAINS.some((d) => linkHost === d || linkHost.endsWith(`.${d}`))
      ) {
        hasExternalOrderingLink = true;
        externalOrderingHref = href;
      }
      if (MARKETPLACE_DOMAINS.some((d) => linkHost === d || linkHost.endsWith(`.${d}`))) {
        hasMarketplaceLink = true;
      }
    }
  });

  const cityLower = city?.toLowerCase() ?? null;
  const categoryKeywords = keywordsFromCategory(place.primaryCategory);

  const phoneDigits = place.phoneNumber ? digitsOnly(place.phoneNumber).slice(-10) : "";
  const phoneOnPage = phoneDigits ? digitsOnly(bodyText).includes(phoneDigits) : false;

  const streetLine = place.formattedAddress?.split(",")[0]?.trim().toLowerCase();
  const addressOnPage = streetLine ? bodyTextLower.includes(streetLine) : false;

  const words = bodyText.split(/\s+/).filter(Boolean);
  const sentences = bodyText.split(/[.!?]+/).filter((s) => s.trim().length > 3);
  const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;

  const hasOrderCta = ORDER_CTA_PHRASES.some((p) => bodyTextLower.includes(p));
  const explainsDirectOrderingBenefits = DIRECT_ORDER_BENEFIT_PHRASES.some((p) =>
    bodyTextLower.includes(p)
  );

  const headings = $("h1, h2, h3")
    .map((_, el) => $(el).text().trim().toLowerCase())
    .get();
  const hasAboutSection = headings.some((h) => /\babout\b/.test(h));
  const hasFaqSection =
    headings.some((h) => /\bfaq|frequently asked\b/.test(h)) ||
    $('[itemtype*="FAQPage"]').length > 0;

  const reviewMarkupCount =
    $('[itemtype*="Review"], [class*="review" i], [id*="review" i], [class*="testimonial" i]')
      .length;
  const hasReviewsSection = reviewMarkupCount >= 3;

  return {
    hostname,
    isCustomDomain,
    hasFavicon,
    h1,
    title,
    metaDescription,
    ogTitle,
    ogDescription,
    ogImage,
    twitterCard,
    altTagRatio: totalImages > 0 ? imagesWithAlt / totalImages : null,
    totalImages,
    imagesWithAlt,
    phoneOnPage,
    addressOnPage,
    socialLinks: Array.from(socialLinks),
    wordCount: words.length,
    avgWordsPerSentence,
    hasExternalOrderingLink,
    externalOrderingHref,
    hasMarketplaceLink,
    hasOrderCta,
    hasAboutSection,
    hasReviewsSection,
    hasFaqSection,
    explainsDirectOrderingBenefits,
    categoryKeywords,
    cityLower,
  };
}

/**
 * SEO Content checklist for the "Search Results" report section: headline
 * and metadata signals that affect how the site ranks and how it's
 * presented in search results.
 */
export function buildSeoContentGroups(
  a: WebsiteAnalysis,
  place: PlaceDetails
): ChecklistGroup[] {
  const h1Lower = a.h1.toLowerCase();
  const titleLower = a.title.toLowerCase();
  const descriptionLower = a.metaDescription.toLowerCase();

  return [
    {
      title: "Headline (H1)",
      items: [
        {
          id: "h1-area",
          label: "Includes the service area",
          passed: Boolean(a.cityLower && h1Lower.includes(a.cityLower)),
          detail: a.h1 || undefined,
        },
        {
          id: "h1-keyword",
          label: "Includes relevant keywords",
          passed: a.categoryKeywords.some((k) => h1Lower.includes(k)),
          detail: a.h1 || undefined,
        },
        {
          id: "h1-exists",
          label: "Exists",
          passed: a.h1.length > 0,
          detail: a.h1 || undefined,
        },
      ],
    },
    {
      title: "Metadata",
      items: [
        {
          id: "alt-tags",
          label: 'Images have "alt tags"',
          passed: a.totalImages === 0 || (a.altTagRatio ?? 0) >= 0.8,
          detail: a.totalImages > 0 ? `${a.imagesWithAlt}/${a.totalImages} images` : "0 images with alt tags",
        },
        {
          id: "description-length",
          label: "Description length",
          passed: a.metaDescription.length >= MIN_DESCRIPTION_LENGTH,
          detail: a.metaDescription || undefined,
        },
        {
          id: "description-area",
          label: "Description includes the service area",
          passed: Boolean(a.cityLower && descriptionLower.includes(a.cityLower)),
        },
        {
          id: "description-keyword",
          label: "Description includes relevant keywords",
          passed: a.categoryKeywords.some((k) => descriptionLower.includes(k)),
        },
        {
          id: "title-matches-gbp",
          label: "Page title matches Google Business Profile",
          passed: Boolean(place.name && titleLower.includes(place.name.toLowerCase())),
          detail: a.title || undefined,
        },
        {
          id: "title-area",
          label: "Page title includes the service area",
          passed: Boolean(a.cityLower && titleLower.includes(a.cityLower)),
        },
        {
          id: "title-keyword",
          label: "Page title includes a relevant keyword",
          passed: a.categoryKeywords.some((k) => titleLower.includes(k)),
        },
        {
          id: "og-image",
          label: "Open Graph image set",
          passed: Boolean(a.ogImage),
        },
      ],
    },
  ];
}

/**
 * Website content + appearance checklist for the "Guest Experience" report
 * section — how well the site itself converts and serves visitors.
 */
export function buildGuestExperienceGroups(
  a: WebsiteAnalysis,
  place: PlaceDetails,
  ordering: OrderingSignals | null
): ChecklistGroup[] {
  const hasOnlineOrdering = ordering?.hasOnlineOrdering ?? false;

  return [
    {
      title: "Website content",
      items: [
        {
          id: "on-site-ordering",
          label: "On-site ordering",
          passed: !a.hasExternalOrderingLink,
          detail: a.externalOrderingHref ?? undefined,
        },
        {
          id: "order-cta",
          label: "Effective CTA for online ordering",
          passed: !hasOnlineOrdering || a.hasOrderCta,
        },
        {
          id: "text-content",
          label: "Sufficient text content",
          passed: a.wordCount >= MIN_TEXT_WORDS,
          detail: `${a.wordCount} words`,
        },
        {
          id: "phone-on-page",
          label: "Phone number",
          passed: a.phoneOnPage,
          detail: place.phoneNumber,
        },
        {
          id: "favicon",
          label: "Favicon",
          passed: a.hasFavicon,
        },
        {
          id: "direct-ordering-only",
          label: "Direct ordering links only",
          passed: !a.hasMarketplaceLink,
        },
      ],
    },
    {
      title: "Website appearance",
      items: [
        {
          id: "about-section",
          label: "Compelling About Us section",
          passed: a.hasAboutSection,
        },
        {
          id: "readable-text",
          label: "Readable text",
          passed: a.avgWordsPerSentence > 0 && a.avgWordsPerSentence <= 25,
        },
        {
          id: "customer-reviews",
          label: "3 customer reviews",
          passed: a.hasReviewsSection,
        },
        {
          id: "faq-section",
          label: "FAQ's section",
          passed: a.hasFaqSection,
        },
        {
          id: "direct-ordering-benefits",
          label: "Explain benefits of direct ordering",
          passed: !hasOnlineOrdering || a.explainsDirectOrderingBenefits,
        },
      ],
    },
  ];
}
