import { PRODUCT_STATUS } from '../config/constants.js';
import {
  assertAllowedFields,
  assertArray,
  assertBoolean,
  assertEnumValue,
  assertMongoId,
  assertNonNegativeNumber,
  assertPlainObject,
  assertRequiredFields,
  assertUrl
} from './common.js';

const productFields = [
  'productId',
  'name',
  'category',
  'description',
  'images',
  'sellingPrice',
  'status',
  'suppliers',
  'listings',
  'activeSupplier'
];

const supplierRelationshipFields = [
  'supplier',
  'buyPrice',
  'isAvailable',
  'stockQuantity',
  'deliveryDays',
  'notes',
  'lastCheckedAt'
];

const validateProductBody = (body, isCreate) => {
  assertAllowedFields(body, productFields);

  if (isCreate) {
    assertRequiredFields(body, ['productId', 'name', 'category', 'sellingPrice']);
  }

  if (body.status) {
    body.status = body.status.toUpperCase();
  }

  assertEnumValue(body.status, Object.values(PRODUCT_STATUS), 'status');
  assertNonNegativeNumber(body.sellingPrice, 'sellingPrice');
  assertArray(body.images, 'images');
  assertArray(body.suppliers, 'suppliers');
  assertArray(body.listings, 'listings');
  assertMongoId(body.activeSupplier, 'activeSupplier');

  if (Array.isArray(body.images)) {
    body.images.forEach((image, index) => assertUrl(image, `images[${index}]`));
  }

  if (Array.isArray(body.suppliers)) {
    body.suppliers.forEach((relationship, index) => {
      assertPlainObject(relationship, `suppliers[${index}]`);
      assertAllowedFields(relationship, supplierRelationshipFields);
      assertRequiredFields(relationship, ['supplier']);
      assertMongoId(relationship.supplier, `suppliers[${index}].supplier`);
      assertNonNegativeNumber(relationship.buyPrice, `suppliers[${index}].buyPrice`);
      assertBoolean(relationship.isAvailable, `suppliers[${index}].isAvailable`);
      assertNonNegativeNumber(relationship.stockQuantity, `suppliers[${index}].stockQuantity`);
      assertNonNegativeNumber(relationship.deliveryDays, `suppliers[${index}].deliveryDays`);
    });
  }

  if (Array.isArray(body.listings)) {
    body.listings.forEach((listingId, index) => assertMongoId(listingId, `listings[${index}]`));
  }
};

export const validateCreateProduct = (req) => {
  validateProductBody(req.body, true);
};

export const validateUpdateProduct = (req) => {
  validateProductBody(req.body, false);
};
