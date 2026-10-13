import { Router } from 'express';
import { listCustomers, createCustomer } from '../controllers/customers.controller.js';

const router = Router();

router.get('/', listCustomers);
router.post('/', createCustomer);

export default router;
