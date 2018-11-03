//
// Records the name of the player
//

'use strict';

const buttons = require('../buttons');
const {ri} = require('@jargon/alexa-skill-sdk');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest') &&
      (request.intent.name === 'ChangeNameIntent'));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let speech;
    let reprompt;
    const speechParams = {};

    if (!event.request.intent || !event.request.intent.slots
      || !event.request.intent.slots.Name
      || !event.request.intent.slots.Name.value) {
      // Delegate this
      return handlerInput.responseBuilder
        .addDelegateDirective(event.request.intent)
        .getResponse();
    }

    // OK, we have a name - repeat it back and remind them they can change at any time
    attributes.name = event.request.intent.slots.Name.value;
    speechParams.Name = attributes.name;
    speech = 'CHANGE_CONFIRM';
    if (!attributes.temp.namePrompt) {
      speech += '_PROMPT_CHANGE';
      attributes.temp.namePrompt = true;
    }

    reprompt = 'CHANGE_REPROMPT';
    if (attributes.temp.newGame && buttons.supportButtons(handlerInput)
      && !(attributes.temp.buttons && attributes.temp.buttons.discard)) {
      reprompt += '_BUTTON';
      speech += '_BUTTON';
    }

    return handlerInput.jrb
      .speak(ri(speech, speechParams))
      .reprompt(ri(reprompt))
      .getResponse();
  },
};

