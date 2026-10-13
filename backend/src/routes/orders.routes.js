import { Router } from 'express';
import {
  listOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  exportOrders,
} from '../controllers/orders.controller.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/export', requireRole('admin'), exportOrders);
router.get('/', listOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);
router.patch('/:id/status', updateOrderStatus);

export default router;
