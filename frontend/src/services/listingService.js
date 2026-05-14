import { listingApi } from '../api/listingApi.js';

export const listingService = {
  list: (params) => listingApi.getListings(params),
  create: (payload) => listingApi.createListing(payload)
};
