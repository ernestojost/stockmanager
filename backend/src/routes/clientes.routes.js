import { Router } from 'express';
import { listClientes, createCliente } from '../controllers/clientes.controller.js';

const router = Router();

router.get('/', listClientes);
router.post('/', createCliente);

export default router;
