// Cross-component signal that the current user's server state changed
// (a generation consumed quota, the plan was upgraded, ...). DashboardLayout
// listens and updates its /api/users/me snapshot so the sidebar usage meter
// never goes stale. detail may carry { generationToday, generationLimit, plan }
// to patch in place; with no detail the listener refetches.
export const USER_CHANGED_EVENT = "coldpen:user-changed";

export function emitUserChanged(detail) {
  window.dispatchEvent(new CustomEvent(USER_CHANGED_EVENT, { detail }));
}
