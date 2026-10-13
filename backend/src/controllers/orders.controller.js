import PDFDocument from 'pdfkit';
import { pool } from '../config/db.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { recordMovement } from './stockMovements.controller.js';

const formatCurrency = (n) =>
  Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const formatDate = (d) => new Date(d).toLocaleString('en-US');

const STATUSES = ['pending', 'delivered', 'cancelled'];

function buildOrderFilters({ status, from, to }) {
  const clauses = [];
  const params = [];

  if (status) {
    clauses.push('o.status = ?');
    params.push(status);
  }
  if (from) {
    clauses.push('o.created_at >= ?');
    params.push(`${from} 00:00:00`);
  }
  if (to) {
    clauses.push('o.created_at <= ?');
    params.push(`${to} 23:59:59`);
  }

  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

async function fetchFilteredOrders(query) {
  const { where, params } = buildOrderFilters(query);
  const [rows] = await pool.query(
    `SELECT o.id, o.status, o.total, o.created_at,
            o.customer_id, c.name AS customer_name,
            o.user_id, u.name AS user_name
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     JOIN users u ON u.id = o.user_id
     ${where}
     ORDER BY o.created_at DESC`,
    params
  );
  return rows;
}

export const listOrders = asyncHandler(async (req, res) => {
  res.json(await fetchFilteredOrders(req.query));
});

export const getOrder = asyncHandler(async (req, res) => {
  const [orderRows] = await pool.query(
    `SELECT o.id, o.status, o.total, o.created_at,
            o.customer_id, c.name AS customer_name,
            o.user_id, u.name AS user_name
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     JOIN users u ON u.id = o.user_id
     WHERE o.id = ?`,
    [req.params.id]
  );
  const order = orderRows[0];
  if (!order) throw new ApiError(404, 'Order not found');

  const [items] = await pool.query(
    `SELECT oi.id, oi.product_id, pr.name AS product_name, oi.quantity, oi.unit_price
     FROM order_items oi
     JOIN products pr ON pr.id = oi.product_id
     WHERE oi.order_id = ?`,
    [req.params.id]
  );

  res.json({ ...order, items });
});

export const createOrder = asyncHandler(async (req, res) => {
  const { customer_id, items } = req.body;

  if (!customer_id) throw new ApiError(400, 'Customer is required');
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'An order must contain at least one product');
  }
  for (const item of items) {
    if (!item.product_id || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new ApiError(400, 'Each item must have a product_id and a positive quantity');
    }
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [customerRows] = await connection.query('SELECT id FROM customers WHERE id = ?', [customer_id]);
    if (!customerRows[0]) throw new ApiError(400, 'Invalid customer');

    let total = 0;
    const itemsToInsert = [];

    for (const item of items) {
      const [productRows] = await connection.query(
        'SELECT id, name, price, current_stock, active FROM products WHERE id = ? FOR UPDATE',
        [item.product_id]
      );
      const product = productRows[0];

      if (!product || !product.active) {
        throw new ApiError(400, `Product ${item.product_id} is not available`);
      }
      if (product.current_stock < item.quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for "${product.name}" (available: ${product.current_stock})`
        );
      }

      const unit_price = product.price;
      total += unit_price * item.quantity;
      const resultingStock = product.current_stock - item.quantity;
      itemsToInsert.push({
        product_id: product.id,
        quantity: item.quantity,
        unit_price,
        resultingStock,
      });

      await connection.query('UPDATE products SET current_stock = current_stock - ? WHERE id = ?', [
        item.quantity,
        product.id,
      ]);
    }

    const [orderResult] = await connection.query(
      'INSERT INTO orders (customer_id, user_id, status, total) VALUES (?, ?, ?, ?)',
      [customer_id, req.user.id, 'pending', total]
    );
    const orderId = orderResult.insertId;

    for (const item of itemsToInsert) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.unit_price]
      );
      await recordMovement(connection, {
        productId: item.product_id,
        type: 'sale',
        quantity: -item.quantity,
        resultingStock: item.resultingStock,
        orderId,
        userId: req.user.id,
      });
    }

    await connection.commit();
    res.status(201).json({ id: orderId, customer_id, status: 'pending', total, items: itemsToInsert });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) throw new ApiError(400, 'Invalid status');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [orderRows] = await connection.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [req.params.id]);
    const order = orderRows[0];
    if (!order) throw new ApiError(404, 'Order not found');

    if (order.status !== 'pending') {
      throw new ApiError(400, `Cannot change the status of a ${order.status} order`);
    }
    if (status === 'pending') {
      throw new ApiError(400, 'The order is already pending');
    }

    if (status === 'cancelled') {
      const [items] = await connection.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [
        req.params.id,
      ]);
      for (const item of items) {
        const [productRows] = await connection.query('SELECT current_stock FROM products WHERE id = ? FOR UPDATE', [
          item.product_id,
        ]);
        const resultingStock = productRows[0].current_stock + item.quantity;

        await connection.query('UPDATE products SET current_stock = ? WHERE id = ?', [
          resultingStock,
          item.product_id,
        ]);
        await recordMovement(connection, {
          productId: item.product_id,
          type: 'cancellation',
          quantity: item.quantity,
          resultingStock,
          orderId: req.params.id,
          userId: req.user.id,
        });
      }
    }

    await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    await connection.commit();

    res.json({ id: Number(req.params.id), status });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

export const exportOrders = asyncHandler(async (req, res) => {
  const { format = 'csv' } = req.query;
  if (!['csv', 'pdf'].includes(format)) throw new ApiError(400, 'Invalid format (csv or pdf)');

  const orders = await fetchFilteredOrders(req.query);

  if (format === 'csv') {
    const header = ['#', 'Customer', 'Date', 'Total', 'Status'];
    const rows = orders.map((o) => [
      o.id,
      o.customer_name,
      formatDate(o.created_at),
      Number(o.total).toFixed(2),
      o.status,
    ]);
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.send('﻿' + csv);
    return;
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="orders.pdf"');

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);

  doc.fontSize(16).text('StockManager — Orders', { align: 'left' });
  doc.fontSize(9).fillColor('#666').text(new Date().toLocaleString('en-US'));
  doc.moveDown(1);

  const colX = { id: 40, customer: 80, date: 260, total: 400, status: 480 };
  const rowHeight = 20;

  function drawHeader(y) {
    doc.fontSize(9).fillColor('#000').font('Helvetica-Bold');
    doc.text('#', colX.id, y);
    doc.text('Customer', colX.customer, y);
    doc.text('Date', colX.date, y);
    doc.text('Total', colX.total, y);
    doc.text('Status', colX.status, y);
    doc.font('Helvetica');
  }

  let y = doc.y;
  drawHeader(y);
  y += rowHeight;

  let grandTotal = 0;
  for (const o of orders) {
    if (y > 760) {
      doc.addPage();
      y = 40;
      drawHeader(y);
      y += rowHeight;
    }
    doc.fontSize(9).fillColor('#000');
    doc.text(String(o.id), colX.id, y);
    doc.text(o.customer_name, colX.customer, y, { width: 170 });
    doc.text(formatDate(o.created_at), colX.date, y);
    doc.text(formatCurrency(o.total), colX.total, y);
    doc.text(o.status, colX.status, y);
    if (o.status !== 'cancelled') grandTotal += Number(o.total);
    y += rowHeight;
  }

  doc.moveTo(40, y).lineTo(555, y).strokeColor('#ccc').stroke();
  y += 10;
  doc.fontSize(10).font('Helvetica-Bold').text(`Total (excl. cancelled): ${formatCurrency(grandTotal)}`, colX.total, y);

  doc.end();
});
