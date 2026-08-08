import { Router } from 'express';
import { listCategorias } from '../controllers/categorias.controller.js';

const router = Router();

router.get('/', listCategorias);

export default router;
