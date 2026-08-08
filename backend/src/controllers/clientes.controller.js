import { pool } from '../config/db.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

export const listClientes = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const params = [];
  let where = '';
  if (search) {
    where = 'WHERE nombre LIKE ?';
    params.push(`%${search}%`);
  }
  const [rows] = await pool.query(
    `SELECT id, nombre, telefono, email, created_at FROM clientes ${where} ORDER BY nombre`,
    params
  );
  res.json(rows);
});

export const createCliente = asyncHandler(async (req, res) => {
  const { nombre, telefono = null, email = null } = req.body;
  if (!nombre || !nombre.trim()) throw new ApiError(400, 'El nombre es requerido');

  const [result] = await pool.query(
    'INSERT INTO clientes (nombre, telefono, email) VALUES (?, ?, ?)',
    [nombre.trim(), telefono, email]
  );

  const [rows] = await pool.query('SELECT id, nombre, telefono, email, created_at FROM clientes WHERE id = ?', [
    result.insertId,
  ]);
  res.status(201).json(rows[0]);
});
