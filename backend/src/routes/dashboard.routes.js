import { Router } from 'express';
import { getResumen } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/resumen', getResumen);

export default router;
