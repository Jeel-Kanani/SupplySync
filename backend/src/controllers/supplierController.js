import * as supplierService from '../services/supplierService.js';
import { sendSuccess } from '../utils/response.js';

export const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await supplierService.getSuppliers(req.query);
    sendSuccess(res, 200, suppliers);
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req, res, next) => {
  try {
    const supplier = await supplierService.createSupplier(req.body);
    sendSuccess(res, 201, supplier);
  } catch (error) {
    next(error);
  }
};

export const getSupplierProducts = async (req, res, next) => {
  try {
    const products = await supplierService.getSupplierProducts(req.params.id);
    sendSuccess(res, 200, products);
  } catch (error) {
    next(error);
  }
};

export const getSupplierRankings = async (_req, res, next) => {
  try {
    const rankings = await supplierService.getSupplierRankings();
    sendSuccess(res, 200, rankings);
  } catch (error) {
    next(error);
  }
};
