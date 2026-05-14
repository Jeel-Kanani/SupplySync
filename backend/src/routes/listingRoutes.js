import { Router } from 'express';

import {
  createListing,
  getListings
} from '../controllers/listingController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { validateCreateListing } from '../validators/listingValidator.js';

const router = Router();

router
  .route('/')
  .get(getListings)
  .post(validateRequest(validateCreateListing), createListing);

export default router;
