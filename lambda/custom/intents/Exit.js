//
// Handles stop, which will exit the skill
//

'use strict';

const ads = require('../ads');

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
    const res = require('../resources')(handlerInput);

    return new Promise((resolve, reject) => {
      ads.getAd(attributes, 'threecardpoker', event.request.locale, (adText) => {
        const response = handlerInput.responseBuilder
          .speak(res.getString('EXIT_GAME')
            .replace('{0}', adText)
            .replace('{1}', (attributes.name) ? attributes.name : ''))
          .withShouldEndSession(true)
          .getResponse();
        resolve(response);
      });
    });
  },
};
