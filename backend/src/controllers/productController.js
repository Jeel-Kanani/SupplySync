import * as productService from '../services/productService.js';
import * as productCalculationService from '../services/productCalculationService.js';
import { sendSuccess } from '../utils/response.js';

export const getProducts = async (req, res, next) => {
  try {
    const products = await productService.getProducts(req.query);
    sendSuccess(res, 200, products);
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    sendSuccess(res, 200, product);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    sendSuccess(res, 201, product);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    sendSuccess(res, 200, product);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await productService.deleteProduct(req.params.id);
    sendSuccess(res, 200, product);
  } catch (error) {
    next(error);
  }
};

export const getProductStatus = async (req, res, next) => {
  try {
    const status = await productCalculationService.getProductStatus(req.params.id);
    sendSuccess(res, 200, status);
  } catch (error) {
    next(error);
  }
};

export const getProductProfit = async (req, res, next) => {
  try {
    const profit = await productCalculationService.getProductProfit(req.params.id);
    sendSuccess(res, 200, profit);
  } catch (error) {
    next(error);
  }
};

export const getProductBestSupplier = async (req, res, next) => {
  try {
    const bestSupplier = await productCalculationService.getProductBestSupplier(req.params.id);
    sendSuccess(res, 200, bestSupplier);
  } catch (error) {
    next(error);
  }
};

export const recalculateProduct = async (req, res, next) => {
  try {
    const calculation = await productCalculationService.recalculateProduct(req.params.id);
    sendSuccess(res, 200, calculation);
  } catch (error) {
    next(error);
  }
};
