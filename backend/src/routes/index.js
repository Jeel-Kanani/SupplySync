import { Router } from 'express';

import listingRoutes from './listingRoutes.js';
import productRoutes from './productRoutes.js';
import supplierRoutes from './supplierRoutes.js';

const router = Router();

router.use('/products', productRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/listings', listingRoutes);

export default router;
