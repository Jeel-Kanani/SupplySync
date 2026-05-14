import { isNormalizedProductUsable } from '../../services/dataNormalizationService.js';

export class BaseAdapter {
  constructor(source = {}) {
    if (new.target === BaseAdapter) {
      throw new Error('BaseAdapter is abstract and cannot be instantiated directly');
    }

    this.source = source;
    this.sourceType = source.sourceType;
  }

  async execute() {
    throw new Error('Adapter execute() must be implemented by subclasses');
  }

  validateNormalizedData(normalizedProduct) {
    if (!isNormalizedProductUsable(normalizedProduct)) {
      throw new Error('Adapter returned invalid normalized product data');
    }

    return normalizedProduct;
  }
}
