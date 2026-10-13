import { Router } from 'express';
import { listUsers, createUser } from '../controllers/users.controller.js';

const router = Router();

router.get('/', listUsers);
router.post('/', createUser);

export default router;
