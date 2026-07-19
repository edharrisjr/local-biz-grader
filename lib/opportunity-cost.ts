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
    // Conservative end of the industry-cited range (~$2,250-$24,000+/mo
    // depending on call volume and ticket size): 150 missed calls/month x
    // 60% actionable x $25 average order.
    monthlyAmount: 2250,
    detail:
      "Missed calls x how many would've ordered/booked x average ticket. A modest estimate (150 missed calls/mo, 60% actionable, $25 average order) already runs ~$2,250/mo — higher-volume businesses lose considerably more.",
  },
  {
    id: "followup-retention",
    label: "No customer follow-up system",
    // Narrowly-scoped industry estimate for reactivation loss alone (not
    // the broader $2,552-$5,604/mo "total CRM gap" figure, which bundles
    // in other revenue paths beyond just follow-up): guests who haven't
    // ordered in 30/60/90 days and are never re-engaged.
    monthlyAmount: 1452,
    detail:
      "Lapsed guests (30/60/90 days) x win-back rate x average visit value. Without automated re-engagement, most restaurants lose ~$1,452/mo in reactivation revenue alone.",
  },
];
