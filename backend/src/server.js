import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { requireAuth, requireRole } from './middleware/auth.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import productsRoutes from './routes/products.routes.js';
import customersRoutes from './routes/customers.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import usersRoutes from './routes/users.routes.js';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/categories', requireAuth, categoriesRoutes);
app.use('/api/products', requireAuth, productsRoutes);
app.use('/api/customers', requireAuth, customersRoutes);
app.use('/api/orders', requireAuth, ordersRoutes);
app.use('/api/dashboard', requireAuth, requireRole('admin'), dashboardRoutes);
app.use('/api/users', requireAuth, requireRole('admin'), usersRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`StockManager API listening on http://localhost:${port}`);
});
