//
// Handles refund of premium content
//

'use strict';

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest')
      && (request.intent.name === 'RefundIntent'));
  },
  handle: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const directive = {
      'type': 'Connections.SendRequest',
      'name': 'Cancel',
      'payload': {
        'InSkillProduct': {
          'productId': attributes.paid.morehands.productId,
        },
      },
      'token': 'Cancel',
    };

    return handlerInput.jrb
      .addDirective(directive)
      .withShouldEndSession(true)
      .getResponse();
  },
};
