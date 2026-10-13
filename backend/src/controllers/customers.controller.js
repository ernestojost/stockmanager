import { pool } from '../config/db.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

export const listCustomers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const params = [];
  let where = '';
  if (search) {
    where = 'WHERE name LIKE ?';
    params.push(`%${search}%`);
  }
  const [rows] = await pool.query(
    `SELECT id, name, phone, email, created_at FROM customers ${where} ORDER BY name`,
    params
  );
  res.json(rows);
});

export const createCustomer = asyncHandler(async (req, res) => {
  const { name, phone = null, email = null } = req.body;
  if (!name || !name.trim()) throw new ApiError(400, 'Name is required');

  const [result] = await pool.query(
    'INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)',
    [name.trim(), phone, email]
  );

  const [rows] = await pool.query('SELECT id, name, phone, email, created_at FROM customers WHERE id = ?', [
    result.insertId,
  ]);
  res.status(201).json(rows[0]);
});
