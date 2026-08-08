import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const listCategorias = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT id, nombre FROM categorias ORDER BY nombre');
  res.json(rows);
});
