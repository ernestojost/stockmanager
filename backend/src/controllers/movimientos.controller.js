import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const listMovimientosPorProducto = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT m.id, m.tipo, m.cantidad, m.stock_resultante, m.pedido_id, m.created_at,
            u.nombre AS usuario_nombre
     FROM movimientos_stock m
     JOIN usuarios u ON u.id = m.usuario_id
     WHERE m.producto_id = ?
     ORDER BY m.created_at DESC, m.id DESC`,
    [req.params.id]
  );
  res.json(rows);
});

// Inserta un movimiento de stock. Pensada para reusarse dentro de transacciones
// existentes (createProducto, updateProducto, createPedido, updateEstadoPedido),
// por eso recibe la conexión en vez de usar el pool directamente.
export async function registrarMovimiento(
  connection,
  { productoId, tipo, cantidad, stockResultante, pedidoId = null, usuarioId }
) {
  await connection.query(
    `INSERT INTO movimientos_stock (producto_id, tipo, cantidad, stock_resultante, pedido_id, usuario_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [productoId, tipo, cantidad, stockResultante, pedidoId, usuarioId]
  );
}
