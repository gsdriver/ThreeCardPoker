//
// Handles stop, which will exit the skill
//

'use strict';

const ads = require('../ads');
const {ri} = require('@jargon/alexa-skill-sdk');

module.exports = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    // Can always handle with Stop and Cancel
    if (request.type === 'IntentRequest') {
      if ((request.intent.name === 'AMAZON.CancelIntent')
        || (request.intent.name === 'AMAZON.StopIntent')) {
        return true;
      }
      if (request.intent.name === 'AMAZON.NoIntent') {
        return (!attributes.temp.newGame && (attributes.temp.holding === undefined));
      }
    }

    return false;
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const speechParams = {};

    return ads.getAd(attributes, 'threecardpoker', event.request.locale)
    .then((adText) => {
      speechParams.Ad = adText;
      speechParams.Name = (attributes.name) ? attributes.name : '';
      return handlerInput.jrb
        .speak(ri('EXIT_GAME', speechParams))
        .withShouldEndSession(true)
        .getResponse();
    });
  },
};
