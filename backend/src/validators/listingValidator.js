import { LISTING_STATUS, MARKETPLACE_PLATFORM } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';
import {
  assertAllowedFields,
  assertEnumValue,
  assertNonNegativeNumber,
  assertRequiredFields,
  assertUrl
} from './common.js';

const listingFields = [
  'listingId',
  'productId',
  'linkedProduct',
  'platform',
  'listingUrl',
  'listingPrice',
  'marketplaceFees',
  'status'
];

export const validateCreateListing = (req) => {
  assertAllowedFields(req.body, listingFields);
  assertRequiredFields(req.body, ['listingId', 'platform', 'listingUrl', 'listingPrice']);

  const productReference = req.body.linkedProduct || req.body.productId;

  if (typeof productReference !== 'string' || productReference.trim() === '') {
    throw new ApiError(400, 'productId must be a valid product reference');
  }

  req.body.productId = productReference.trim();
  req.body.linkedProduct = productReference.trim();

  if (req.body.platform) {
    req.body.platform = req.body.platform.toUpperCase();
  }

  if (req.body.status) {
    req.body.status = req.body.status.toUpperCase();
  }

  assertEnumValue(req.body.platform, Object.values(MARKETPLACE_PLATFORM), 'platform');
  assertEnumValue(req.body.status, Object.values(LISTING_STATUS), 'status');
  assertUrl(req.body.listingUrl, 'listingUrl');
  assertNonNegativeNumber(req.body.listingPrice, 'listingPrice');
  assertNonNegativeNumber(req.body.marketplaceFees, 'marketplaceFees');
};
