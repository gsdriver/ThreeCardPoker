//
// Handles purchasing of premium content
//

'use strict';

const utils = require('../utils');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    if ((request.type === 'IntentRequest')
      && ((attributes.paid && (request.intent.name === 'PurchaseIntent'))
      || (attributes.temp.purchasing &&
        ((request.intent.name === 'AMAZON.NoIntent')
          || (request.intent.name === 'AMAZON.YesIntent'))))) {
      return true;
    }

    attributes.temp.purchasing = undefined;
    return false;
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(handlerInput);

    if (attributes.temp.purchasing && (event.request.intent.name === 'AMAZON.NoIntent')) {
      attributes.temp.purchasing = undefined;
      return handlerInput.responseBuilder
        .speak(res.getString('PURCHASE_NO_PURCHASE'))
        .reprompt(res.getString('PURCHASE_NO_PURCHASE'))
        .getResponse();
    } else {
      if ((event.request.intent.name === 'AMAZON.YesIntent') ||
        (event.request.intent.slots && event.request.intent.slots.Product
          && event.request.intent.slots.Product.value)) {
        // They specified a product so let's go with that one
        // Since we only support morehands, that's the one we'll offer
        return handlerInput.responseBuilder
          .addDirective(utils.getPurchaseDirective(attributes, 'Buy'))
          .withShouldEndSession(true)
          .getResponse();
      } else {
        // Tell them about more hands
        attributes.temp.purchasing = true;
        return handlerInput.responseBuilder
          .speak(res.getString('PURCHASE_MOREHANDS'))
          .reprompt(res.getString('PURCHASE_CONFIRM_REPROMPT'))
          .getResponse();
      }
    }
  },
};
