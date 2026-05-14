import { SOURCE_TYPES } from '../../config/constants.js';
import { IndiaMartScraper } from '../scrapers/indiaMartScraper.js';
import { WebsiteAdapter } from './WebsiteAdapter.js';

export class IndiaMartAdapter extends WebsiteAdapter {
  constructor(source = {}) {
    super(
      {
        ...source,
        sourceType: SOURCE_TYPES.INDIAMART
      },
      new IndiaMartScraper()
    );
  }
}
