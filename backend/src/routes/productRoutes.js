import { Router } from 'express';

import {
  createProduct,
  deleteProduct,
  getProductBestSupplier,
  getProductById,
  getProductProfit,
  getProducts,
  getProductStatus,
  recalculateProduct,
  updateProduct
} from '../controllers/productController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  validateCreateProduct,
  validateUpdateProduct
} from '../validators/productValidator.js';

const router = Router();

router
  .route('/')
  .get(getProducts)
  .post(validateRequest(validateCreateProduct), createProduct);

router.get('/:id/status', getProductStatus);
router.get('/:id/profit', getProductProfit);
router.get('/:id/best-supplier', getProductBestSupplier);
router.post('/:id/recalculate', recalculateProduct);

router
  .route('/:id')
  .get(getProductById)
  .put(validateRequest(validateUpdateProduct), updateProduct)
  .delete(deleteProduct);

export default router;
