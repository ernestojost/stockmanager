import { Router } from 'express';
import {
  listProductos,
  getProducto,
  createProducto,
  updateProducto,
  deleteProducto,
} from '../controllers/productos.controller.js';
import { listMovimientosPorProducto } from '../controllers/movimientos.controller.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', listProductos);
router.get('/:id', getProducto);
router.get('/:id/movimientos', requireRole('admin'), listMovimientosPorProducto);
router.post('/', requireRole('admin'), createProducto);
router.put('/:id', requireRole('admin'), updateProducto);
router.delete('/:id', requireRole('admin'), deleteProducto);

export default router;
