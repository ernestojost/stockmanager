import { pool } from '../config/db.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

const GROUPINGS = {
  day: 'DATE(created_at)',
  week: "DATE(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY))",
  month: "DATE_FORMAT(created_at, '%Y-%m-01')",
};

export const getSummary = asyncHandler(async (req, res) => {
  const [[{ month_sales_total }]] = await pool.query(
    `SELECT COALESCE(SUM(total), 0) AS month_sales_total
     FROM orders
     WHERE status != 'cancelled'
       AND YEAR(created_at) = YEAR(CURDATE())
       AND MONTH(created_at) = MONTH(CURDATE())`
  );

  const [[{ pending_orders }]] = await pool.query(
    `SELECT COUNT(*) AS pending_orders FROM orders WHERE status = 'pending'`
  );

  const [top_products] = await pool.query(
    `SELECT pr.id, pr.name, SUM(oi.quantity) AS units_sold
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products pr ON pr.id = oi.product_id
     WHERE o.status != 'cancelled'
     GROUP BY pr.id, pr.name
     ORDER BY units_sold DESC
     LIMIT 5`
  );

  res.json({ month_sales_total, pending_orders, top_products });
});

export const getSalesByPeriod = asyncHandler(async (req, res) => {
  const { group_by = 'day', from, to } = req.query;
  const groupBySql = GROUPINGS[group_by];
  if (!groupBySql) throw new ApiError(400, 'Invalid grouping (day, week or month)');

  const clauses = ["status != 'cancelled'"];
  const params = [];

  if (from) {
    clauses.push('created_at >= ?');
    params.push(`${from} 00:00:00`);
  } else {
    clauses.push('created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)');
  }
  if (to) {
    clauses.push('created_at <= ?');
    params.push(`${to} 23:59:59`);
  }

  const [rows] = await pool.query(
    `SELECT ${groupBySql} AS period, SUM(total) AS total
     FROM orders
     WHERE ${clauses.join(' AND ')}
     GROUP BY period
     ORDER BY period ASC`,
    params
  );

  res.json(rows);
});
