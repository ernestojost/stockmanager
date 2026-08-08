import { Router } from 'express';
import { getResumen, getVentasPorPeriodo } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/resumen', getResumen);
router.get('/ventas', getVentasPorPeriodo);

export default router;
