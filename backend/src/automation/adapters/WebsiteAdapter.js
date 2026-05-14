import { SOURCE_TYPES } from '../../config/constants.js';
import { normalizeWebsiteData } from '../../services/dataNormalizationService.js';
import { WebsiteScraper } from '../scrapers/websiteScraper.js';
import { BaseAdapter } from './BaseAdapter.js';

export class WebsiteAdapter extends BaseAdapter {
  constructor(source = {}, scraper = new WebsiteScraper()) {
    super({
      ...source,
      sourceType: source.sourceType || SOURCE_TYPES.WEBSITE
    });
    this.scraper = scraper;
  }

  async execute() {
    if (!this.source.url) {
      throw new Error('Website adapter requires a source URL');
    }

    const rawData = await this.scraper.scrapeSupplierPage(this.source.url);
    const normalizedProduct = normalizeWebsiteData(rawData, {
      ...this.source,
      sourceUrl: this.source.url,
      sourceType: this.source.sourceType || SOURCE_TYPES.WEBSITE
    });

    return this.validateNormalizedData(normalizedProduct);
  }
}
