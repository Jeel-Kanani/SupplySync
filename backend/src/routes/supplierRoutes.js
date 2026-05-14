import { Router } from 'express';

import {
  createSupplier,
  getSupplierProducts,
  getSupplierRankings,
  getSuppliers
} from '../controllers/supplierController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { validateCreateSupplier } from '../validators/supplierValidator.js';

const router = Router();

router
  .route('/')
  .get(getSuppliers)
  .post(validateRequest(validateCreateSupplier), createSupplier);

router.get('/rankings', getSupplierRankings);
router.get('/:id/products', getSupplierProducts);

export default router;
