import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { requireAuth } from './middleware/auth.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import categoriasRoutes from './routes/categorias.routes.js';
import productosRoutes from './routes/productos.routes.js';
import clientesRoutes from './routes/clientes.routes.js';
import pedidosRoutes from './routes/pedidos.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/categorias', requireAuth, categoriasRoutes);
app.use('/api/productos', requireAuth, productosRoutes);
app.use('/api/clientes', requireAuth, clientesRoutes);
app.use('/api/pedidos', requireAuth, pedidosRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`StockManager API escuchando en http://localhost:${port}`);
});
