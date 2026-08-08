import { pool } from '../config/db.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

const ESTADOS = ['pendiente', 'entregado', 'cancelado'];

export const listPedidos = asyncHandler(async (req, res) => {
  const { estado, desde, hasta } = req.query;
  const clauses = [];
  const params = [];

  if (estado) {
    clauses.push('p.estado = ?');
    params.push(estado);
  }
  if (desde) {
    clauses.push('p.created_at >= ?');
    params.push(`${desde} 00:00:00`);
  }
  if (hasta) {
    clauses.push('p.created_at <= ?');
    params.push(`${hasta} 23:59:59`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT p.id, p.estado, p.total, p.created_at,
            p.cliente_id, c.nombre AS cliente_nombre,
            p.usuario_id, u.nombre AS usuario_nombre
     FROM pedidos p
     JOIN clientes c ON c.id = p.cliente_id
     JOIN usuarios u ON u.id = p.usuario_id
     ${where}
     ORDER BY p.created_at DESC`,
    params
  );
  res.json(rows);
});

export const getPedido = asyncHandler(async (req, res) => {
  const [pedidoRows] = await pool.query(
    `SELECT p.id, p.estado, p.total, p.created_at,
            p.cliente_id, c.nombre AS cliente_nombre,
            p.usuario_id, u.nombre AS usuario_nombre
     FROM pedidos p
     JOIN clientes c ON c.id = p.cliente_id
     JOIN usuarios u ON u.id = p.usuario_id
     WHERE p.id = ?`,
    [req.params.id]
  );
  const pedido = pedidoRows[0];
  if (!pedido) throw new ApiError(404, 'Pedido no encontrado');

  const [items] = await pool.query(
    `SELECT pi.id, pi.producto_id, pr.nombre AS producto_nombre, pi.cantidad, pi.precio_unitario
     FROM pedido_items pi
     JOIN productos pr ON pr.id = pi.producto_id
     WHERE pi.pedido_id = ?`,
    [req.params.id]
  );

  res.json({ ...pedido, items });
});

export const createPedido = asyncHandler(async (req, res) => {
  const { cliente_id, items } = req.body;

  if (!cliente_id) throw new ApiError(400, 'El cliente es requerido');
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'El pedido debe tener al menos un producto');
  }
  for (const item of items) {
    if (!item.producto_id || !Number.isInteger(item.cantidad) || item.cantidad <= 0) {
      throw new ApiError(400, 'Cada item debe tener producto_id y cantidad positiva');
    }
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [clienteRows] = await connection.query('SELECT id FROM clientes WHERE id = ?', [cliente_id]);
    if (!clienteRows[0]) throw new ApiError(400, 'Cliente inválido');

    let total = 0;
    const itemsToInsert = [];

    for (const item of items) {
      const [productoRows] = await connection.query(
        'SELECT id, nombre, precio, stock_actual, activo FROM productos WHERE id = ? FOR UPDATE',
        [item.producto_id]
      );
      const producto = productoRows[0];

      if (!producto || !producto.activo) {
        throw new ApiError(400, `Producto ${item.producto_id} no disponible`);
      }
      if (producto.stock_actual < item.cantidad) {
        throw new ApiError(
          400,
          `Stock insuficiente para "${producto.nombre}" (disponible: ${producto.stock_actual})`
        );
      }

      const precio_unitario = producto.precio;
      total += precio_unitario * item.cantidad;
      itemsToInsert.push({ producto_id: producto.id, cantidad: item.cantidad, precio_unitario });

      await connection.query('UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?', [
        item.cantidad,
        producto.id,
      ]);
    }

    const [pedidoResult] = await connection.query(
      'INSERT INTO pedidos (cliente_id, usuario_id, estado, total) VALUES (?, ?, ?, ?)',
      [cliente_id, req.user.id, 'pendiente', total]
    );
    const pedidoId = pedidoResult.insertId;

    for (const item of itemsToInsert) {
      await connection.query(
        'INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [pedidoId, item.producto_id, item.cantidad, item.precio_unitario]
      );
    }

    await connection.commit();
    res.status(201).json({ id: pedidoId, cliente_id, estado: 'pendiente', total, items: itemsToInsert });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

export const updateEstadoPedido = asyncHandler(async (req, res) => {
  const { estado } = req.body;
  if (!ESTADOS.includes(estado)) throw new ApiError(400, 'Estado inválido');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [pedidoRows] = await connection.query('SELECT * FROM pedidos WHERE id = ? FOR UPDATE', [req.params.id]);
    const pedido = pedidoRows[0];
    if (!pedido) throw new ApiError(404, 'Pedido no encontrado');

    if (pedido.estado !== 'pendiente') {
      throw new ApiError(400, `No se puede cambiar el estado de un pedido ${pedido.estado}`);
    }
    if (estado === 'pendiente') {
      throw new ApiError(400, 'El pedido ya está pendiente');
    }

    if (estado === 'cancelado') {
      const [items] = await connection.query('SELECT producto_id, cantidad FROM pedido_items WHERE pedido_id = ?', [
        req.params.id,
      ]);
      for (const item of items) {
        await connection.query('UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?', [
          item.cantidad,
          item.producto_id,
        ]);
      }
    }

    await connection.query('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, req.params.id]);
    await connection.commit();

    res.json({ id: Number(req.params.id), estado });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});
