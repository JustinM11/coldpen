import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { EmailModel } from "../models/email.model.js";

const router = Router();

const DAY_MS = 24 * 60 * 60 * 1000;

// Local YYYY-MM-DD for a Date — matches the to_char() format the model uses,
// without the UTC shift that toISOString() introduces on non-UTC servers.
function localDay(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Longest run of consecutive calendar days in a sorted list of YYYY-MM-DD
// strings. Parsed as UTC so day gaps are always exactly 24h — local-time
// parsing breaks across DST transitions, where midnights sit 23h/25h apart.
function longestStreak(days) {
  let best = 0;
  let run = 0;
  let prev = null;
  for (const day of days) {
    const t = Date.parse(`${day}T00:00:00Z`);
    run = prev !== null && t - prev === DAY_MS ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}

router.get("/dashboard", ...protect, async (req, res, next) => {
  try {
    const [stats, analytics] = await Promise.all([
      EmailModel.getStats(req.user.id),
      EmailModel.getAnalytics(req.user.id),
    ]);

    // Fill the last 14 days so the chart always has a fixed window,
    // including days with zero generations.
    const countsByDay = Object.fromEntries(
      analytics.daily.map((r) => [r.day, r.count]),
    );
    // Walk back day by day with setDate() rather than subtracting i*24h —
    // calendar arithmetic stays correct across DST, fixed offsets don't.
    const days = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      days.unshift(localDay(cursor));
      cursor.setDate(cursor.getDate() - 1);
    }
    const daily = days.map((day) => ({ day, count: countsByDay[day] ?? 0 }));

    const monthPrefix = localDay(new Date()).slice(0, 7);
    const activeDaysThisMonth = analytics.activeDays.filter((d) =>
      d.startsWith(monthPrefix),
    ).length;

    res.json({
      stats: {
        totalGenerations: parseInt(stats.total_generation, 10),
        totalFavorited: parseInt(stats.total_favorited, 10),
        totalCopies: parseInt(stats.total_copied, 10),
        thisMonth: analytics.thisMonth,
        lastMonth: analytics.lastMonth,
        daily,
        toneMix: analytics.tones,
        activeDaysThisMonth,
        longestStreak: longestStreak(analytics.activeDays),
        topCopied: analytics.topCopied.map((e) => ({
          id: e.id,
          productDescription: e.product_description,
          tone: e.tone,
          copiedCount: e.copied_count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
