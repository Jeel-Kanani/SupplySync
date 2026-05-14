import * as listingService from '../services/listingService.js';
import { sendSuccess } from '../utils/response.js';

export const getListings = async (req, res, next) => {
  try {
    const listings = await listingService.getListings(req.query);
    sendSuccess(res, 200, listings);
  } catch (error) {
    next(error);
  }
};

export const createListing = async (req, res, next) => {
  try {
    const listing = await listingService.createListing(req.body);
    sendSuccess(res, 201, listing);
  } catch (error) {
    next(error);
  }
};
