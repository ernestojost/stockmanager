import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getResumen = asyncHandler(async (req, res) => {
  const [[{ total_vendido_mes }]] = await pool.query(
    `SELECT COALESCE(SUM(total), 0) AS total_vendido_mes
     FROM pedidos
     WHERE estado != 'cancelado'
       AND YEAR(created_at) = YEAR(CURDATE())
       AND MONTH(created_at) = MONTH(CURDATE())`
  );

  const [[{ pedidos_pendientes }]] = await pool.query(
    `SELECT COUNT(*) AS pedidos_pendientes FROM pedidos WHERE estado = 'pendiente'`
  );

  const [productos_mas_vendidos] = await pool.query(
    `SELECT pr.id, pr.nombre, SUM(pi.cantidad) AS unidades_vendidas
     FROM pedido_items pi
     JOIN pedidos p ON p.id = pi.pedido_id
     JOIN productos pr ON pr.id = pi.producto_id
     WHERE p.estado != 'cancelado'
     GROUP BY pr.id, pr.nombre
     ORDER BY unidades_vendidas DESC
     LIMIT 5`
  );

  res.json({ total_vendido_mes, pedidos_pendientes, productos_mas_vendidos });
});
