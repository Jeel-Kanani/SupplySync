import { chromium } from 'playwright';

import { withRetry } from '../utils/retry.js';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export class BaseScraper {
  constructor({
    headless = true,
    retries = 2,
    navigationTimeout = 30000,
    waitTimeout = 10000,
    viewport = { width: 1366, height: 768 }
  } = {}) {
    this.headless = headless;
    this.retries = retries;
    this.navigationTimeout = navigationTimeout;
    this.waitTimeout = waitTimeout;
    this.viewport = viewport;
  }

  async scrape(url, extractor) {
    return withRetry(
      async () => this.runWithPage(url, extractor),
      {
        retries: this.retries,
        delayMs: 1200
      }
    );
  }

  async runWithPage(url, extractor) {
    let browser;
    let context;

    try {
      browser = await chromium.launch({ headless: this.headless });
      context = await browser.newContext({
        viewport: this.viewport,
        userAgent: DEFAULT_USER_AGENT,
        javaScriptEnabled: true,
        ignoreHTTPSErrors: true
      });

      const page = await context.newPage();
      page.setDefaultTimeout(this.waitTimeout);
      page.setDefaultNavigationTimeout(this.navigationTimeout);

      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: this.navigationTimeout
      });

      if (!response || response.status() >= 400) {
        throw new Error(`Page returned status ${response?.status() || 'unknown'}`);
      }

      await this.waitForPageReady(page);
      await this.autoScroll(page);

      return extractor(page, response);
    } finally {
      await this.safeClose(context);
      await this.safeClose(browser);
    }
  }

  async waitForPageReady(page) {
    await page.waitForLoadState('domcontentloaded', { timeout: this.waitTimeout }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: this.waitTimeout }).catch(() => {});
    await page.waitForTimeout(500);
  }

  async autoScroll(page) {
    await page
      .evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 350;
          const maxHeight = Math.min(document.body.scrollHeight || 0, 4000);
          const timer = setInterval(() => {
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= maxHeight) {
              clearInterval(timer);
              window.scrollTo(0, 0);
              resolve();
            }
          }, 100);
        });
      })
      .catch(() => {});
  }

  async getFirstVisibleText(page, selectors = []) {
    for (const selector of selectors) {
      const locator = page.locator(selector).first();
      const count = await locator.count().catch(() => 0);

      if (!count) continue;

      const text = await locator.innerText({ timeout: 1500 }).catch(() => '');
      if (text?.trim()) {
        return text.trim();
      }
    }

    return '';
  }

  async getBodyText(page, maxLength = 8000) {
    const bodyText = await page.locator('body').innerText({ timeout: this.waitTimeout }).catch(() => '');
    return bodyText.slice(0, maxLength);
  }

  async safeClose(resource) {
    if (!resource?.close) return;

    try {
      await resource.close();
    } catch {
      // Browser cleanup is best-effort; the caller gets the original scrape error.
    }
  }
}
