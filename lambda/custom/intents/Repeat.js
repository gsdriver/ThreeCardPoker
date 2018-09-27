//
// Say that again?
//

'use strict';

const utils = require('../utils');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest')
      && (request.intent.name === 'AMAZON.RepeatIntent'));
  },
  handle: function(handlerInput) {
    const res = require('../resources')(handlerInput);
    let speech = '';

    // Tell them their point balance
    speech += res.getString('HANDS_LEFT').replace('{0}', attributes.points);
    speech += attributes.temp.lastResponse;
    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(attributes.temp.lastReprompt)
      .getResponse();
  },
};
