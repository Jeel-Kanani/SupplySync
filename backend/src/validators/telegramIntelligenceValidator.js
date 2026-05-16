import {
  assertAllowedFields,
  assertNonNegativeNumber,
  assertPlainObject,
  assertRequiredFields
} from './common.js';

export const validateClawBotConnect = (req) => {
  assertAllowedFields(req.body, ['apiId', 'apiHash', 'sessionString', 'botToken']);

  if (req.body.apiId !== undefined && req.body.apiId !== '') {
    req.body.apiId = Number(req.body.apiId);
    assertNonNegativeNumber(req.body.apiId, 'apiId');
  }
};

export const validateTelegramMessageIngest = (req) => {
  assertAllowedFields(req.body, [
    'messageId',
    'id',
    'channelId',
    'channelName',
    'channel',
    'sender',
    'rawText',
    'text',
    'message',
    'caption',
    'media',
    'receivedAt',
    'detectedAt',
    'metadata',
    'rawMessage'
  ]);

  assertRequiredFields(req.body, [req.body.rawText ? 'rawText' : req.body.text ? 'text' : 'message']);
  assertNonNegativeNumber(req.body.messageId, 'messageId');
  assertNonNegativeNumber(req.body.id, 'id');

  if (req.body.sender !== undefined) assertPlainObject(req.body.sender, 'sender');
  if (req.body.media !== undefined) assertPlainObject(req.body.media, 'media');
  if (req.body.metadata !== undefined) assertPlainObject(req.body.metadata, 'metadata');
};

export const validateReviewResolution = (req) => {
  assertAllowedFields(req.body, ['reviewedBy', 'reviewNotes']);
};
