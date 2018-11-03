//
// Handles help
//

'use strict';

const utils = require('../utils');
const {ri} = require('@jargon/alexa-skill-sdk');

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
    let speech;
    let promise;
    const speechParams = {};

    // If this was fallback intent, let them know we didn't understand first
    if (event.request.intent.name === 'AMAZON.FallbackIntent') {
      promise = handlerInput.jrm.render(ri('HELP_FALLBACK'));
    } else {
      promise = Promise.resolve('');
    }

    return promise.then((text) => {
      // Tell them the number of hands remaining, and read their hand if in play
      // Don't let them know about buying chips if we don't support it
      speechParams.Chips = attributes.points;
      speechParams.ExtraChips = utils.DAILY_REFRESH_POINTS;
      speech = (attributes.paid && attributes.paid.morehands)
        ? 'HELP_TEXT_BUY_CHIPS' : 'HELP_TEXT';
      if (attributes.temp.buttons && attributes.temp.buttons.hold
        && attributes.temp.buttons.discard) {
        speech += '_BUTTON';
      }

      return handlerInput.jrb
        .speak(ri(speech, speechParams))
        .reprompt(ri('HELP_REPROMPT'))
        .withSimpleCard(ri('HELP_CARD_TITLE'), ri('HELP_CARD_TEXT'))
        .getResponse();
    });
  },
};
