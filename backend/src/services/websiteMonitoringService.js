import { AUTOMATION_ACTION_TYPES, AUTOMATION_LOG_STATUS, SOURCE_TYPES } from '../config/constants.js';
import { Supplier } from '../models/Supplier.js';
import { IndiaMartAdapter } from '../automation/adapters/IndiaMartAdapter.js';
import { WebsiteAdapter } from '../automation/adapters/WebsiteAdapter.js';
import { createAutomationLog, timeOperation } from '../automation/logs/automationLogger.js';
import { detectWebsiteSourceType } from '../automation/utils/sourceUtils.js';
import {
  applyNormalizedProductUpdate,
  recordFailedSourceCheck
} from './automationDataService.js';

export const monitorWebsites = async ({ sources = [] } = {}) => {
  const websiteSources = sources.length ? normalizeManualSources(sources) : await getSupplierWebsiteSources();
  const results = [];

  for (const source of websiteSources) {
    results.push(await runWebsiteSourceCheck(source));
  }

  return {
    checked: results.length,
    succeeded: results.filter((result) => result.status === AUTOMATION_LOG_STATUS.SUCCESS).length,
    failed: results.filter((result) => result.status === AUTOMATION_LOG_STATUS.FAILED).length,
    results
  };
};

export const runWebsiteSourceCheck = async (source) => {
  const sourceType = detectWebsiteSourceType(source.url);
  const adapter = createWebsiteAdapter({ ...source, sourceType });

  try {
    const { data, executionTime } = await timeOperation(async () => {
      const normalizedProduct = await adapter.execute();
      const updateResult = await applyNormalizedProductUpdate(normalizedProduct);

      return {
        normalizedProduct,
        updateResult
      };
    });

    await createAutomationLog({
      actionType: AUTOMATION_ACTION_TYPES.WEBSITE_CHECK,
      sourceType,
      status: AUTOMATION_LOG_STATUS.SUCCESS,
      message: `Website check completed for ${source.url}`,
      executionTime,
      metadata: {
        productName: data.normalizedProduct.productName,
        matched: data.updateResult.matched,
        priceChanged: data.updateResult.priceChanged
      }
    });

    return {
      source,
      sourceType,
      status: AUTOMATION_LOG_STATUS.SUCCESS,
      executionTime,
      ...data
    };
  } catch (error) {
    const executionTime = error.executionTime || 0;

    await Promise.all([
      recordFailedSourceCheck({
        sourceType,
        sourceUrl: source.url,
        sourceName: source.supplierName,
        error,
        executionTime
      }),
      createAutomationLog({
        actionType: AUTOMATION_ACTION_TYPES.WEBSITE_CHECK,
        sourceType,
        status: AUTOMATION_LOG_STATUS.FAILED,
        message: `Website check failed for ${source.url}: ${error.message}`,
        executionTime,
        metadata: { source }
      })
    ]);

    return {
      source,
      sourceType,
      status: AUTOMATION_LOG_STATUS.FAILED,
      executionTime,
      error: error.message
    };
  }
};

export const getSupplierWebsiteSources = async () => {
  const suppliers = await Supplier.find({
    isActive: true,
    website: { $exists: true, $ne: '' }
  }).select('name supplierId website');

  return suppliers.map((supplier) => ({
    supplierId: supplier._id,
    supplierName: supplier.name,
    url: supplier.website
  }));
};

const createWebsiteAdapter = (source) => {
  if (source.sourceType === SOURCE_TYPES.INDIAMART) {
    return new IndiaMartAdapter(source);
  }

  return new WebsiteAdapter(source);
};

const normalizeManualSources = (sources) =>
  sources
    .filter((source) => source?.url || source?.sourceUrl)
    .map((source) => ({
      supplierName: source.supplierName || source.name || '',
      supplierId: source.supplierId || null,
      url: source.url || source.sourceUrl
    }));
