export interface OpportunityCost {
  id: string;
  label: string;
  monthlyAmount: number;
  detail: string;
}

/**
 * Generic industry-benchmark opportunity costs — NOT detected from this
 * business's own data. There's no public signal for whether a business
 * has a missed-call text-back or customer follow-up system, so unlike
 * every other line item in the report these are always shown, the same
 * for every business, and labeled as an industry estimate rather than a
 * specific finding.
 */
export const STANDARD_OPPORTUNITY_COSTS: OpportunityCost[] = [
  {
    id: "missed-call-textback",
    label: "Missed-call text-back",
    monthlyAmount: 150,
    detail:
      "Local businesses typically miss 20-30% of inbound calls; automatically texting missed callers recovers a meaningful share of those as booked customers.",
  },
  {
    id: "followup-retention",
    label: "No customer follow-up system",
    monthlyAmount: 120,
    detail:
      "Without automated rebooking reminders or win-back messages, most businesses lose repeat customers they could otherwise retain.",
  },
];
