import { BaseScraper } from './baseScraper.js';
import {
  extractAvailability,
  extractPrice
} from '../extractors/productDataExtractor.js';

const TITLE_SELECTORS = [
  'h1',
  '[data-testid*="title" i]',
  '[class*="title" i]',
  '[class*="product" i] h1',
  'meta[property="og:title"]'
];

const PRICE_SELECTORS = [
  '[data-testid*="price" i]',
  '[class*="price" i]',
  '[id*="price" i]',
  '[class*="amount" i]',
  '[class*="rate" i]',
  'span:has-text("₹")',
  'div:has-text("₹")'
];

const AVAILABILITY_SELECTORS = [
  '[data-testid*="stock" i]',
  '[class*="stock" i]',
  '[id*="stock" i]',
  '[class*="availability" i]',
  'text=/stock|available|sold out|unavailable/i'
];

export class WebsiteScraper extends BaseScraper {
  async scrapeSupplierPage(url) {
    return this.scrape(url, async (page, response) => {
      const title = await page.title().catch(() => '');
      const productName = await this.getProductName(page, title);
      const priceText = await this.getFirstVisibleText(page, PRICE_SELECTORS);
      const availabilityText = await this.getFirstVisibleText(page, AVAILABILITY_SELECTORS);
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
        detectedAt: new Date()
      };
    });
  }

  async getProductName(page, fallbackTitle) {
    for (const selector of TITLE_SELECTORS) {
      if (selector.startsWith('meta')) {
        const content = await page.locator(selector).first().getAttribute('content').catch(() => '');
        if (content?.trim()) return content.trim();
        continue;
      }

      const text = await this.getFirstVisibleText(page, [selector]);
      if (text) return text;
    }

    return fallbackTitle || '';
  }
}
