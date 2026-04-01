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
    { limit = 20, offset = 0, favoriteOnly = false, search = "" } = {},
  ) {
    let query = `SELECT * FROM emails WHERE user_id = $1`;
    const params = [userId];
    let paramIndex = 2;

    if (favoriteOnly) {
      query += ` AND is_favorited = true`;
    }

    if (search) {
      query += ` AND (
                product_description ILIKE $${paramIndex} 
                OR target_audience ILIKE $${paramIndex}
                OR cta_goal ILIKE $${paramIndex}
            )`;
      params.push(`%${search}%`);
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
};
