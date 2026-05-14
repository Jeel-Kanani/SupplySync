import {
  assertAllowedFields,
  assertArray,
  assertBoolean,
  assertMongoId,
  assertRequiredFields,
  assertScore,
  assertUrl,
  assertNonNegativeNumber
} from './common.js';

const supplierFields = [
  'supplierId',
  'name',
  'website',
  'contactInfo',
  'reliabilityScore',
  'isActive',
  'averageDeliveryDays',
  'suppliedProducts',
  'productsSupplied'
];

export const validateCreateSupplier = (req) => {
  assertAllowedFields(req.body, supplierFields);
  assertRequiredFields(req.body, ['supplierId', 'name']);
  assertUrl(req.body.website, 'website');
  assertScore(req.body.reliabilityScore, 'reliabilityScore');
  assertBoolean(req.body.isActive, 'isActive');
  assertNonNegativeNumber(req.body.averageDeliveryDays, 'averageDeliveryDays');

  if (req.body.productsSupplied && !req.body.suppliedProducts) {
    req.body.suppliedProducts = req.body.productsSupplied;
  }

  assertArray(req.body.suppliedProducts, 'suppliedProducts');
  assertArray(req.body.productsSupplied, 'productsSupplied');

  if (Array.isArray(req.body.suppliedProducts)) {
    req.body.suppliedProducts.forEach((productId, index) => {
      assertMongoId(productId, `suppliedProducts[${index}]`);
    });
  }

  if (Array.isArray(req.body.productsSupplied)) {
    req.body.productsSupplied.forEach((productId, index) => {
      assertMongoId(productId, `productsSupplied[${index}]`);
    });
  }
};
