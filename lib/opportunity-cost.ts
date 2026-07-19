import type { RevenueQualification } from "./types";

export interface OpportunityCost {
  id: string;
  label: string;
  monthlyAmount: number;
  detail: string;
}

/** Share of missed calls that would plausibly have converted to an order
 *  or booking if answered/texted back promptly. */
const MISSED_CALL_ACTIONABLE_RATE = 0.6;

/** Share of a month's customers assumed to go 30/60/90 days without
 *  reordering — a modest, clearly-labeled assumption since we only ask
 *  for sales volume and average order value, not actual repeat-visit
 *  data. */
const LAPSED_CUSTOMER_RATE = 0.2;

/** Share of lapsed customers a follow-up system would realistically win
 *  back, matching the industry example (200 lapsed, 10% won back). */
const WIN_BACK_RATE = 0.1;

/**
 * Computes real, personalized loss estimates from the visitor's own
 * answers to the 4 pre-report questions, using the same formulas as the
 * flat industry benchmarks below: missed calls x actionable rate x
 * average order value, and lapsed customers x win-back rate x average
 * order value.
 */
export function computePersonalizedOpportunityCosts(
  q: RevenueQualification
): OpportunityCost[] {
  const costs: OpportunityCost[] = [];

  if (q.missedCallsPerMonth > 0 && q.avgOrderValue > 0) {
    const amount = Math.round(
      q.missedCallsPerMonth * MISSED_CALL_ACTIONABLE_RATE * q.avgOrderValue
    );
    costs.push({
      id: "missed-call-textback",
      label: "Missed-call text-back",
      monthlyAmount: amount,
      detail: `${q.missedCallsPerMonth} missed calls/mo x 60% actionable x $${q.avgOrderValue} average order.`,
    });
  }

  if (!q.hasFollowUpSystem && q.monthlySales > 0 && q.avgOrderValue > 0) {
    const monthlyOrders = q.monthlySales / q.avgOrderValue;
    const lapsedCustomers = Math.round(monthlyOrders * LAPSED_CUSTOMER_RATE);
    const amount = Math.round(lapsedCustomers * WIN_BACK_RATE * q.avgOrderValue);
    costs.push({
      id: "followup-retention",
      label: "No customer follow-up system",
      monthlyAmount: amount,
      detail: `~${lapsedCustomers} lapsed customers/mo (30/60/90 days) x 10% win-back x $${q.avgOrderValue} average order.`,
    });
  }

  return costs;
}

/**
 * Fallback industry-benchmark opportunity costs, used only when the
 * visitor didn't go through the pre-report qualification questions (e.g.
 * an old report link generated before that flow existed) — otherwise
 * computePersonalizedOpportunityCosts above uses their real numbers.
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
