//
// Unhandled intents
//

'use strict';

const {ri} = require('@jargon/alexa-skill-sdk');

module.exports = {
  canHandle: function(handlerInput) {
    return true;
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;

    // Fail silently if this was an unhandled button event
    if (event.request.type !== 'GameEngine.InputHandlerEvent') {
      return handlerInput.jrb
        .speak(ri('UNKNOWN_INTENT'))
        .reprompt(ri('UNKNOWN_INTENT_REPROMPT'))
        .getResponse();
    }
  },
};
