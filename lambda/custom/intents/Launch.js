//
// Handles opening the skill
//

'use strict';

const utils = require('../utils');
const buttons = require('../buttons');

module.exports = {
  canHandle: function(handlerInput) {
    return handlerInput.requestEnvelope.session.new ||
      (handlerInput.requestEnvelope.request.type === 'LaunchRequest');
  },
  handle: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(handlerInput);
    let response;

    return new Promise((resolve, reject) => {
      utils.getGreeting(handlerInput, (greeting) => {
        attributes.temp.newGame = true;
        let speech = res.getString('LAUNCH_WELCOME').replace('{0}', greeting);
        let reprompt = res.getString('LAUNCH_REPROMPT');
        if (buttons.supportButtons(handlerInput)) {
          reprompt += res.getString('LAUNCH_REPROMPT_BUTTON');
        }
        speech += reprompt;

        response = handlerInput.responseBuilder
          .speak(speech)
          .reprompt(reprompt)
          .getResponse();
        resolve(response);
      });
    });
  },
};
