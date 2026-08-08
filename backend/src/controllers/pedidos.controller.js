import PDFDocument from 'pdfkit';
import { pool } from '../config/db.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { registrarMovimiento } from './movimientos.controller.js';

const formatoMoneda = (n) => `$ ${Number(n).toFixed(2)}`;
const formatoFecha = (d) => new Date(d).toLocaleString('es-AR');

const ESTADOS = ['pendiente', 'entregado', 'cancelado'];

function buildFiltrosPedidos({ estado, desde, hasta }) {
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

  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

async function fetchPedidosFiltrados(query) {
  const { where, params } = buildFiltrosPedidos(query);
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
  return rows;
}

export const listPedidos = asyncHandler(async (req, res) => {
  res.json(await fetchPedidosFiltrados(req.query));
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
      const stockResultante = producto.stock_actual - item.cantidad;
      itemsToInsert.push({
        producto_id: producto.id,
        cantidad: item.cantidad,
        precio_unitario,
        stockResultante,
      });

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
      await registrarMovimiento(connection, {
        productoId: item.producto_id,
        tipo: 'venta',
        cantidad: -item.cantidad,
        stockResultante: item.stockResultante,
        pedidoId,
        usuarioId: req.user.id,
      });
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
        const [productoRows] = await connection.query('SELECT stock_actual FROM productos WHERE id = ? FOR UPDATE', [
          item.producto_id,
        ]);
        const stockResultante = productoRows[0].stock_actual + item.cantidad;

        await connection.query('UPDATE productos SET stock_actual = ? WHERE id = ?', [
          stockResultante,
          item.producto_id,
        ]);
        await registrarMovimiento(connection, {
          productoId: item.producto_id,
          tipo: 'cancelacion',
          cantidad: item.cantidad,
          stockResultante,
          pedidoId: req.params.id,
          usuarioId: req.user.id,
        });
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

export const exportPedidos = asyncHandler(async (req, res) => {
  const { formato = 'csv' } = req.query;
  if (!['csv', 'pdf'].includes(formato)) throw new ApiError(400, 'Formato inválido (csv o pdf)');

  const pedidos = await fetchPedidosFiltrados(req.query);

  if (formato === 'csv') {
    const header = ['#', 'Cliente', 'Fecha', 'Total', 'Estado'];
    const filas = pedidos.map((p) => [
      p.id,
      p.cliente_nombre,
      formatoFecha(p.created_at),
      Number(p.total).toFixed(2),
      p.estado,
    ]);
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [header, ...filas].map((fila) => fila.map(escape).join(',')).join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="pedidos.csv"');
    res.send('﻿' + csv);
    return;
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="pedidos.pdf"');

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);

  doc.fontSize(16).text('StockManager — Pedidos', { align: 'left' });
  doc.fontSize(9).fillColor('#666').text(new Date().toLocaleString('es-AR'));
  doc.moveDown(1);

  const colX = { id: 40, cliente: 80, fecha: 260, total: 400, estado: 480 };
  const rowHeight = 20;

  function drawHeader(y) {
    doc.fontSize(9).fillColor('#000').font('Helvetica-Bold');
    doc.text('#', colX.id, y);
    doc.text('Cliente', colX.cliente, y);
    doc.text('Fecha', colX.fecha, y);
    doc.text('Total', colX.total, y);
    doc.text('Estado', colX.estado, y);
    doc.font('Helvetica');
  }

  let y = doc.y;
  drawHeader(y);
  y += rowHeight;

  let totalGeneral = 0;
  for (const p of pedidos) {
    if (y > 760) {
      doc.addPage();
      y = 40;
      drawHeader(y);
      y += rowHeight;
    }
    doc.fontSize(9).fillColor('#000');
    doc.text(String(p.id), colX.id, y);
    doc.text(p.cliente_nombre, colX.cliente, y, { width: 170 });
    doc.text(formatoFecha(p.created_at), colX.fecha, y);
    doc.text(formatoMoneda(p.total), colX.total, y);
    doc.text(p.estado, colX.estado, y);
    if (p.estado !== 'cancelado') totalGeneral += Number(p.total);
    y += rowHeight;
  }

  doc.moveTo(40, y).lineTo(555, y).strokeColor('#ccc').stroke();
  y += 10;
  doc.fontSize(10).font('Helvetica-Bold').text(`Total (sin cancelados): ${formatoMoneda(totalGeneral)}`, colX.total, y);

  doc.end();
});
