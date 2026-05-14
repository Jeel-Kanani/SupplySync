import { WebsiteScraper } from './websiteScraper.js';
import {
  extractAvailability,
  extractPrice
} from '../extractors/productDataExtractor.js';

const INDIAMART_TITLE_SELECTORS = [
  'h1',
  '.bo h1',
  '#prdName',
  '[class*="prd" i][class*="name" i]',
  '[class*="product" i][class*="name" i]'
];

const INDIAMART_PRICE_SELECTORS = [
  '#price',
  '.price',
  '.bo_price',
  '[class*="prc" i]',
  '[class*="price" i]',
  'span:has-text("₹")'
];

const INDIAMART_STOCK_SELECTORS = [
  '[class*="stock" i]',
  '[class*="available" i]',
  'text=/available|stock|inquiry|sold out/i'
];

export class IndiaMartScraper extends WebsiteScraper {
  async scrapeSupplierPage(url) {
    return this.scrape(url, async (page, response) => {
      const title = await page.title().catch(() => '');
      const productName =
        (await this.getFirstVisibleText(page, INDIAMART_TITLE_SELECTORS)) || title;
      const priceText = await this.getFirstVisibleText(page, INDIAMART_PRICE_SELECTORS);
      const availabilityText = await this.getFirstVisibleText(page, INDIAMART_STOCK_SELECTORS);
      const bodyText = await this.getBodyText(page);
      const combinedText = [productName, title, priceText, availabilityText, bodyText].join('\n');

      return {
        title,
        productName,
        priceText,
        price: extractPrice(priceText || combinedText),
        availabilityText,
        availability: extractAvailability(availabilityText || combinedText, true),
        bodyText,
        statusCode: response.status(),
        finalUrl: page.url(),
        detectedAt: new Date(),
        scraper: 'IndiaMartScraper'
      };
    });
  }
}
