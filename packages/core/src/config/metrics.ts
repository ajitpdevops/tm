/** How "green" each powertrain counts for road scoring (product judgement, not car data). */
export const GREEN_SCORE = { electric: 1, hybrid: 0.75, cng: 0.25, petrol: 0, diesel: 0 } as const;
