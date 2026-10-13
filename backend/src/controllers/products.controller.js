import { pool } from '../config/db.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { recordMovement } from './stockMovements.controller.js';

const SELECT_PRODUCT = `
  SELECT p.id, p.name, p.description, p.category_id, c.name AS category_name,
         p.price, p.current_stock, p.min_stock, p.active, p.created_at
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

export const listProducts = asyncHandler(async (req, res) => {
  const { search, category_id, active } = req.query;
  const clauses = [];
  const params = [];

  if (search) {
    clauses.push('p.name LIKE ?');
    params.push(`%${search}%`);
  }
  if (category_id) {
    clauses.push('p.category_id = ?');
    params.push(category_id);
  }
  if (active !== undefined) {
    clauses.push('p.active = ?');
    params.push(active === 'true' ? 1 : 0);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(`${SELECT_PRODUCT} ${where} ORDER BY p.name`, params);
  res.json(rows);
});

export const getProduct = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`${SELECT_PRODUCT} WHERE p.id = ?`, [req.params.id]);
  if (!rows[0]) throw new ApiError(404, 'Product not found');
  res.json(rows[0]);
});

function validateProductBody(body, { partial = false } = {}) {
  const { name, price, current_stock, min_stock } = body;

  if (!partial || name !== undefined) {
    if (!name || !name.trim()) throw new ApiError(400, 'Name is required');
  }
  if (!partial || price !== undefined) {
    if (price === undefined || Number(price) < 0) {
      throw new ApiError(400, 'Price cannot be negative');
    }
  }
  if (current_stock !== undefined && Number(current_stock) < 0) {
    throw new ApiError(400, 'Current stock cannot be negative');
  }
  if (min_stock !== undefined && Number(min_stock) < 0) {
    throw new ApiError(400, 'Minimum stock cannot be negative');
  }
}

export const createProduct = asyncHandler(async (req, res) => {
  validateProductBody(req.body);
  const { name, description = null, category_id = null, price, current_stock = 0, min_stock = 0 } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO products (name, description, category_id, price, current_stock, min_stock)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name.trim(), description, category_id, price, current_stock, min_stock]
    );

    if (Number(current_stock) > 0) {
      await recordMovement(connection, {
        productId: result.insertId,
        type: 'initial_stock',
        quantity: Number(current_stock),
        resultingStock: Number(current_stock),
        userId: req.user.id,
      });
    }

    await connection.commit();

    const [rows] = await pool.query(`${SELECT_PRODUCT} WHERE p.id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

export const updateProduct = asyncHandler(async (req, res) => {
  validateProductBody(req.body, { partial: true });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [
      req.params.id,
    ]);
    const existing = existingRows[0];
    if (!existing) throw new ApiError(404, 'Product not found');

    const merged = {
      name: req.body.name ?? existing.name,
      description: req.body.description ?? existing.description,
      category_id: req.body.category_id ?? existing.category_id,
      price: req.body.price ?? existing.price,
      current_stock: req.body.current_stock ?? existing.current_stock,
      min_stock: req.body.min_stock ?? existing.min_stock,
      active: req.body.active ?? existing.active,
    };

    await connection.query(
      `UPDATE products SET name = ?, description = ?, category_id = ?, price = ?,
         current_stock = ?, min_stock = ?, active = ? WHERE id = ?`,
      [
        merged.name.trim(),
        merged.description,
        merged.category_id,
        merged.price,
        merged.current_stock,
        merged.min_stock,
        merged.active,
        req.params.id,
      ]
    );

    const stockDelta = Number(merged.current_stock) - Number(existing.current_stock);
    if (stockDelta !== 0) {
      await recordMovement(connection, {
        productId: req.params.id,
        type: 'manual_adjustment',
        quantity: stockDelta,
        resultingStock: Number(merged.current_stock),
        userId: req.user.id,
      });
    }

    await connection.commit();

    const [rows] = await pool.query(`${SELECT_PRODUCT} WHERE p.id = ?`, [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const [result] = await pool.query('UPDATE products SET active = FALSE WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) throw new ApiError(404, 'Product not found');
  res.status(204).send();
});
