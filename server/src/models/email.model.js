import { db } from "../config/database.js";

export const EmailModel = {
  async create({
    userId,
    productDescription,
    targetAudience,
    tone,
    ctaGoal,
    variations,
  }) {
    const result = await db.query(
      `INSERT INTO emails (user_id, product_description, target_audience, tone, cta_goal, variations)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
      [
        userId,
        productDescription,
        targetAudience,
        tone,
        ctaGoal,
        JSON.stringify(variations),
      ],
    );
    return result.rows[0];
  },

  async findByUser(
    userId,
    { limit = 20, offset = 0, favoriteOnly = false, search = "", tone = "" } = {},
  ) {
    let query = `SELECT * FROM emails WHERE user_id = $1`;
    const params = [userId];
    let paramIndex = 2;

    if (favoriteOnly) {
      query += ` AND is_favorited = true`;
    }

    if (tone) {
      query += ` AND tone = $${paramIndex}`;
      params.push(tone.toLowerCase());
      paramIndex++;
    }

    if (search) {
      query += ` AND (
                product_description ILIKE $${paramIndex}
                OR target_audience ILIKE $${paramIndex}
                OR cta_goal ILIKE $${paramIndex}
            )`;
      // Escape LIKE wildcards so a search for "100%" or "a_b" matches those
      // literal characters instead of acting as a pattern.
      params.push(`%${search.replace(/([\\%_])/g, "\\$1")}%`);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  },

  async findById(emailId, userId) {
    const result = await db.query(
      `SELECT * FROM emails WHERE id = $1 AND user_id = $2`,
      [emailId, userId],
    );
    return result.rows[0] || null;
  },

  async toggleFavorite(emailId, userId) {
    const result = await db.query(
      `UPDATE emails
            SET is_favorited = NOT is_favorited
            WHERE id = $1 AND user_id = $2
            RETURNING *`,
      [emailId, userId],
    );
    return result.rows[0] || null;
  },

  async incrementCopyCount(emailId, userId) {
    const result = await db.query(
      `UPDATE emails
            SET copied_count = copied_count + 1
            WHERE id = $1 AND user_id = $2
            RETURNING copied_count`,
      [emailId, userId],
    );
    return result.rows[0] || null;
  },

  async delete(emailId, userId) {
    const result = await db.query(
      `DELETE FROM emails WHERE id = $1 AND user_id = $2 RETURNING id`,
      [emailId, userId],
    );
    return result.rows.length > 0;
  },

  async getStats(userId) {
    const result = await db.query(
      `SELECT
                COUNT(*) as total_generation,
                COUNT(*) FILTER (WHERE is_favorited = true) as total_favorited,
                COALESCE(SUM(copied_count), 0) as total_copied
            FROM emails
            WHERE user_id = $1`,
      [userId],
    );
    return result.rows[0];
  },

  // Aggregates for the analytics dashboard. Dates are serialized with to_char
  // so they cross the pg driver as plain YYYY-MM-DD strings — a DATE parsed
  // into a JS Date shifts by a day when serialized on a non-UTC server.
  async getAnalytics(userId) {
    const [daily, tones, months, activeDays, topCopied] = await Promise.all([
      db.query(
        `SELECT to_char(created_at::date, 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
           FROM emails
          WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '14 days'
          GROUP BY 1`,
        [userId],
      ),
      db.query(
        `SELECT tone, COUNT(*)::int AS count
           FROM emails
          WHERE user_id = $1
          GROUP BY tone
          ORDER BY count DESC`,
        [userId],
      ),
      db.query(
        `SELECT
           COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW()))::int AS this_month,
           COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW()) - INTERVAL '1 month'
                              AND created_at <  date_trunc('month', NOW()))::int AS last_month
         FROM emails
         WHERE user_id = $1`,
        [userId],
      ),
      db.query(
        `SELECT DISTINCT to_char(created_at::date, 'YYYY-MM-DD') AS day
           FROM emails
          WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '90 days'
          ORDER BY 1`,
        [userId],
      ),
      db.query(
        `SELECT id, product_description, tone, copied_count
           FROM emails
          WHERE user_id = $1 AND copied_count > 0
          ORDER BY copied_count DESC, created_at DESC
          LIMIT 3`,
        [userId],
      ),
    ]);

    return {
      daily: daily.rows,
      tones: tones.rows,
      thisMonth: months.rows[0].this_month,
      lastMonth: months.rows[0].last_month,
      activeDays: activeDays.rows.map((r) => r.day),
      topCopied: topCopied.rows,
    };
  },

  // Everything the user owns, for the JSON data export.
  async findAllByUser(userId) {
    const result = await db.query(
      `SELECT id, product_description, target_audience, tone, cta_goal,
              variations, is_favorited, copied_count, created_at
         FROM emails
        WHERE user_id = $1
        ORDER BY created_at DESC`,
      [userId],
    );
    return result.rows;
  },
};
