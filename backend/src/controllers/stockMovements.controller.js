import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const listMovementsByProduct = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT m.id, m.type, m.quantity, m.resulting_stock, m.order_id, m.created_at,
            u.name AS user_name
     FROM stock_movements m
     JOIN users u ON u.id = m.user_id
     WHERE m.product_id = ?
     ORDER BY m.created_at DESC, m.id DESC`,
    [req.params.id]
  );
  res.json(rows);
});

// Inserts a stock movement. Meant to be reused inside existing transactions
// (createProduct, updateProduct, createOrder, updateOrderStatus), which is why
// it takes the connection instead of using the pool directly.
export async function recordMovement(
  connection,
  { productId, type, quantity, resultingStock, orderId = null, userId }
) {
  await connection.query(
    `INSERT INTO stock_movements (product_id, type, quantity, resulting_stock, order_id, user_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [productId, type, quantity, resultingStock, orderId, userId]
  );
}
