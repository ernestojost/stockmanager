import { Router } from 'express';
import {
  listProductos,
  getProducto,
  createProducto,
  updateProducto,
  deleteProducto,
} from '../controllers/productos.controller.js';

const router = Router();

router.get('/', listProductos);
router.get('/:id', getProducto);
router.post('/', createProducto);
router.put('/:id', updateProducto);
router.delete('/:id', deleteProducto);

export default router;
