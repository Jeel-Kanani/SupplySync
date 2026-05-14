import {
  assertAllowedFields,
  assertArray,
  assertBoolean,
  assertNonNegativeNumber,
  assertPlainObject,
  assertRequiredFields,
  assertUrl
} from './common.js';

export const validateRunWebsites = (req) => {
  assertAllowedFields(req.body, ['sources']);
  assertArray(req.body.sources, 'sources');

  if (Array.isArray(req.body.sources)) {
    req.body.sources.forEach((source, index) => {
      assertPlainObject(source, `sources[${index}]`);
      assertAllowedFields(source, ['url', 'sourceUrl', 'supplierName', 'supplierId', 'name']);
      assertUrl(source.url || source.sourceUrl, `sources[${index}].url`);
    });
  }
};

export const validateRunTelegram = (req) => {
  assertAllowedFields(req.body, [
    'message',
    'text',
    'messageId',
    'username',
    'sourceUrl',
    'supplierName',
    'detectedAt'
  ]);

  if (req.body.sourceUrl) {
    assertUrl(req.body.sourceUrl, 'sourceUrl');
  }

  assertNonNegativeNumber(req.body.messageId, 'messageId');
};

export const validateTelegramConnect = (req) => {
  assertAllowedFields(req.body, ['apiId', 'apiHash', 'sessionString', 'botToken']);
  assertNonNegativeNumber(req.body.apiId, 'apiId');
};

export const validateAddTelegramChannel = (req) => {
  assertAllowedFields(req.body, [
    'username',
    'channel',
    'channelId',
    'title',
    'name',
    'supplierName',
    'sourceUrl',
    'isActive',
    'metadata'
  ]);
  assertRequiredFields(req.body, [req.body.channel ? 'channel' : 'username']);

  if (req.body.sourceUrl) {
    assertUrl(req.body.sourceUrl, 'sourceUrl');
  }

  assertBoolean(req.body.isActive, 'isActive');

  if (req.body.metadata !== undefined) {
    assertPlainObject(req.body.metadata, 'metadata');
  }
};
