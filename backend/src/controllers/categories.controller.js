import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const listCategories = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT id, name FROM categories ORDER BY name');
  res.json(rows);
});
