//
// Handles refund of premium content
//

'use strict';

const utils = require('../utils');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest')
      && (request.intent.name === 'RefundIntent'));
  },
  handle: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    return handlerInput.responseBuilder
      .addDirective(utils.getPurchaseDirective(attributes, 'Cancel'))
      .withShouldEndSession(true)
      .getResponse();
  },
};
