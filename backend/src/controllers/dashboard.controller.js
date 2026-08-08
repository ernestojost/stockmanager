import { pool } from '../config/db.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

const AGRUPACIONES = {
  dia: 'DATE(created_at)',
  semana: "DATE(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY))",
  mes: "DATE_FORMAT(created_at, '%Y-%m-01')",
};

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

export const getVentasPorPeriodo = asyncHandler(async (req, res) => {
  const { agrupacion = 'dia', desde, hasta } = req.query;
  const agrupacionSql = AGRUPACIONES[agrupacion];
  if (!agrupacionSql) throw new ApiError(400, 'Agrupación inválida (dia, semana o mes)');

  const clauses = ["estado != 'cancelado'"];
  const params = [];

  if (desde) {
    clauses.push('created_at >= ?');
    params.push(`${desde} 00:00:00`);
  } else {
    clauses.push('created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)');
  }
  if (hasta) {
    clauses.push('created_at <= ?');
    params.push(`${hasta} 23:59:59`);
  }

  const [rows] = await pool.query(
    `SELECT ${agrupacionSql} AS periodo, SUM(total) AS total
     FROM pedidos
     WHERE ${clauses.join(' AND ')}
     GROUP BY periodo
     ORDER BY periodo ASC`,
    params
  );

  res.json(rows);
});
