//
// Records the name of the player
//

'use strict';

const buttons = require('../buttons');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest') &&
      (request.intent.name === 'ChangeNameIntent'));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(handlerInput);
    let speech;
    let reprompt;

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
    speech = res.getString('CHANGE_CONFIRM').replace('{0}', attributes.name);
    if (!attributes.temp.namePrompt) {
      speech += res.getString('CHANGE_PROMPT_CHANGE');
      attributes.temp.namePrompt = true;
    }

    reprompt = res.getString('CHANGE_REPROMPT');
    if (attributes.temp.newGame && buttons.supportButtons(handlerInput)
      && !(attributes.temp.buttons && attributes.temp.buttons.discard)) {
      reprompt += res.getString('CHANGE_REPROMPT_BUTTON');
    }
    speech += reprompt;

    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .getResponse();
  },
};

