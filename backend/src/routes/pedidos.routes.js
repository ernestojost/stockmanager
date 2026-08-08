import { Router } from 'express';
import {
  listPedidos,
  getPedido,
  createPedido,
  updateEstadoPedido,
  exportPedidos,
} from '../controllers/pedidos.controller.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/export', requireRole('admin'), exportPedidos);
router.get('/', listPedidos);
router.get('/:id', getPedido);
router.post('/', createPedido);
router.patch('/:id/estado', updateEstadoPedido);

export default router;
