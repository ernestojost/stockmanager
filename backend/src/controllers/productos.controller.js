import { pool } from '../config/db.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

const SELECT_PRODUCTO = `
  SELECT p.id, p.nombre, p.descripcion, p.categoria_id, c.nombre AS categoria_nombre,
         p.precio, p.stock_actual, p.stock_minimo, p.activo, p.created_at
  FROM productos p
  LEFT JOIN categorias c ON c.id = p.categoria_id
`;

export const listProductos = asyncHandler(async (req, res) => {
  const { search, categoria_id, activo } = req.query;
  const clauses = [];
  const params = [];

  if (search) {
    clauses.push('p.nombre LIKE ?');
    params.push(`%${search}%`);
  }
  if (categoria_id) {
    clauses.push('p.categoria_id = ?');
    params.push(categoria_id);
  }
  if (activo !== undefined) {
    clauses.push('p.activo = ?');
    params.push(activo === 'true' ? 1 : 0);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(`${SELECT_PRODUCTO} ${where} ORDER BY p.nombre`, params);
  res.json(rows);
});

export const getProducto = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`${SELECT_PRODUCTO} WHERE p.id = ?`, [req.params.id]);
  if (!rows[0]) throw new ApiError(404, 'Producto no encontrado');
  res.json(rows[0]);
});

function validateProductoBody(body, { partial = false } = {}) {
  const { nombre, precio, stock_actual, stock_minimo } = body;

  if (!partial || nombre !== undefined) {
    if (!nombre || !nombre.trim()) throw new ApiError(400, 'El nombre es requerido');
  }
  if (!partial || precio !== undefined) {
    if (precio === undefined || Number(precio) < 0) {
      throw new ApiError(400, 'El precio no puede ser negativo');
    }
  }
  if (stock_actual !== undefined && Number(stock_actual) < 0) {
    throw new ApiError(400, 'El stock actual no puede ser negativo');
  }
  if (stock_minimo !== undefined && Number(stock_minimo) < 0) {
    throw new ApiError(400, 'El stock mínimo no puede ser negativo');
  }
}

export const createProducto = asyncHandler(async (req, res) => {
  validateProductoBody(req.body);
  const { nombre, descripcion = null, categoria_id = null, precio, stock_actual = 0, stock_minimo = 0 } = req.body;

  const [result] = await pool.query(
    `INSERT INTO productos (nombre, descripcion, categoria_id, precio, stock_actual, stock_minimo)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nombre.trim(), descripcion, categoria_id, precio, stock_actual, stock_minimo]
  );

  const [rows] = await pool.query(`${SELECT_PRODUCTO} WHERE p.id = ?`, [result.insertId]);
  res.status(201).json(rows[0]);
});

export const updateProducto = asyncHandler(async (req, res) => {
  validateProductoBody(req.body, { partial: true });

  const [existingRows] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
  const existing = existingRows[0];
  if (!existing) throw new ApiError(404, 'Producto no encontrado');

  const merged = {
    nombre: req.body.nombre ?? existing.nombre,
    descripcion: req.body.descripcion ?? existing.descripcion,
    categoria_id: req.body.categoria_id ?? existing.categoria_id,
    precio: req.body.precio ?? existing.precio,
    stock_actual: req.body.stock_actual ?? existing.stock_actual,
    stock_minimo: req.body.stock_minimo ?? existing.stock_minimo,
    activo: req.body.activo ?? existing.activo,
  };

  await pool.query(
    `UPDATE productos SET nombre = ?, descripcion = ?, categoria_id = ?, precio = ?,
       stock_actual = ?, stock_minimo = ?, activo = ? WHERE id = ?`,
    [
      merged.nombre.trim(),
      merged.descripcion,
      merged.categoria_id,
      merged.precio,
      merged.stock_actual,
      merged.stock_minimo,
      merged.activo,
      req.params.id,
    ]
  );

  const [rows] = await pool.query(`${SELECT_PRODUCTO} WHERE p.id = ?`, [req.params.id]);
  res.json(rows[0]);
});

export const deleteProducto = asyncHandler(async (req, res) => {
  const [result] = await pool.query('UPDATE productos SET activo = FALSE WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) throw new ApiError(404, 'Producto no encontrado');
  res.status(204).send();
});
