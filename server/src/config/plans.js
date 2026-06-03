// Single source of truth for per-plan daily generation limits.
// Imported by the rate limiter and the /users/me endpoint so the two can't drift.
export const PLAN_LIMITS = {
  free: 5,
  pro: 1000,
};

export function limitForPlan(plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}
