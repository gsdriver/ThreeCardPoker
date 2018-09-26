//
// Handles help
//

'use strict';

const utils = require('../utils');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest') &&
      ((request.intent.name === 'AMAZON.HelpIntent') ||
      (request.intent.name === 'AMAZON.FallbackIntent')));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(handlerInput);
    let speech = '';

    // If this was fallback intent, let them know we didn't understand first
    if (event.request.intent.name === 'AMAZON.FallbackIntent') {
      speech += res.getString('HELP_FALLBACK');
    }

    // Tell them the number of hands remaining, and read their hand if in play
    speech += res.getString('HELP_TEXT')
      .replace('{0}', attributes.points)
      .replace('{1}', utils.DAILY_REFRESH_POINTS);
    const reprompt = res.getString('HELP_REPROMPT');
    speech += reprompt;
    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .withSimpleCard(res.getString('HELP_CARD_TITLE'), res.getString('HELP_CARD_TEXT'))
      .getResponse();
  },
};
