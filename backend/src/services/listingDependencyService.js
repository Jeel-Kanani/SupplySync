import { BUSINESS_RULES, LISTING_HEALTH, LISTING_STATUS, PRODUCT_STATUS } from '../config/constants.js';
import { Listing } from '../models/Listing.js';

export const updateListingsForProduct = async (product, bestSupplierRanking = null) => {
  const listings = await Listing.find({
    $or: [{ linkedProduct: product._id }, { productId: product._id }]
  });

  const updatedListings = await Promise.all(
    listings.map(async (listing) => {
      const marketplaceFees = Number(listing.marketplaceFees || BUSINESS_RULES.DEFAULT_MARKETPLACE_FEES);
      const estimatedProfit = calculateListingProfit({
        listingPrice: listing.listingPrice,
        buyPrice: bestSupplierRanking?.buyPrice || 0,
        marketplaceFees
      });

      const dependencyState = getListingDependencyState(product.status, estimatedProfit);

      listing.linkedProduct = product._id;
      listing.productId = product._id;
      listing.marketplaceFees = marketplaceFees;
      listing.estimatedProfit = estimatedProfit;
      listing.status = dependencyState.status;
      listing.health = dependencyState.health;

      return listing.save();
    })
  );

  return updatedListings;
};

export const calculateListingProfit = ({ listingPrice, buyPrice, marketplaceFees }) =>
  roundCurrency(Number(listingPrice || 0) - Number(buyPrice || 0) - Number(marketplaceFees || 0));

const getListingDependencyState = (productStatus, estimatedProfit) => {
  if (productStatus === PRODUCT_STATUS.DEAD) {
    return {
      status: LISTING_STATUS.INACTIVE,
      health: LISTING_HEALTH.INACTIVE
    };
  }

  if (productStatus === PRODUCT_STATUS.LOW_PROFIT || estimatedProfit < BUSINESS_RULES.MIN_PROFIT_AMOUNT) {
    return {
      status: LISTING_STATUS.PAUSED,
      health: LISTING_HEALTH.RISKY
    };
  }

  if (productStatus === PRODUCT_STATUS.RISKY) {
    return {
      status: LISTING_STATUS.ACTIVE,
      health: LISTING_HEALTH.RISKY
    };
  }

  return {
    status: LISTING_STATUS.ACTIVE,
    health: LISTING_HEALTH.HEALTHY
  };
};

const roundCurrency = (value) => Number(Number(value || 0).toFixed(2));
