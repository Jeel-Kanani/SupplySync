import { Router } from 'express';

import listingRoutes from './listingRoutes.js';
import automationRoutes from './automationRoutes.js';
import productRoutes from './productRoutes.js';
import supplierRoutes from './supplierRoutes.js';
import telegramRoutes from './telegramRoutes.js';
import telegramIntelligenceRoutes from './telegramIntelligenceRoutes.js';

const router = Router();

router.use('/products', productRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/listings', listingRoutes);
router.use('/automation', automationRoutes);
router.use('/telegram', telegramRoutes);
router.use('/telegram-intelligence', telegramIntelligenceRoutes);

export default router;
