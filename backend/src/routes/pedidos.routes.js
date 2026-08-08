import { Router } from 'express';
import { listPedidos, getPedido, createPedido, updateEstadoPedido } from '../controllers/pedidos.controller.js';

const router = Router();

router.get('/', listPedidos);
router.get('/:id', getPedido);
router.post('/', createPedido);
router.patch('/:id/estado', updateEstadoPedido);

export default router;
