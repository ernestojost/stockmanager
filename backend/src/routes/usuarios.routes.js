import { Router } from 'express';
import { listUsuarios, createUsuario } from '../controllers/usuarios.controller.js';

const router = Router();

router.get('/', listUsuarios);
router.post('/', createUsuario);

export default router;
