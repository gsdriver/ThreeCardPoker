//
// Starts the game when the user presses an Echo Button
//

'use strict';

const buttons = require('../buttons');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    // Buttons can only be set before the game has started
    // Ignore if they already have both hold and discard buttons set
    // or if they pressed the hold button again before a discard button is set
    if ((request.type === 'GameEngine.InputHandlerEvent') && attributes.temp.newGame) {
      if (attributes.temp.buttons && attributes.temp.buttons.hold
        && attributes.temp.buttons.discard) {
        return false;
      }
      attributes.temp.buttonId = buttons.getPressedButton(request);
      return (!attributes.temp.buttons || (attributes.temp.buttons.hold !== attributes.temp.buttonId));
    }

    return false;
  },
  handle: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(handlerInput);
    let buttonColor;
    let speech;
    let reprompt;

    // Save this button
    attributes.usedButton = true;
    if (!attributes.temp.buttons) {
      attributes.temp.buttons = {};
    }
    if (!attributes.temp.buttons.hold) {
      attributes.temp.buttons.hold = attributes.temp.buttonId;
      speech = res.getString('STARTGAME_PRESS_DISCARD')
        .replace('{0}', (attributes.name) ? attributes.name : '');
      reprompt = res.getString('STARTGAME_PRESS_DISCARD_REPROMPT');
    } else {
      attributes.temp.buttons.discard = attributes.temp.buttonId;
      speech = res.getString('STARTGAME_START');
      reprompt = res.getString((attributes.name) ? 'STARTGAME_START_REPROMPT' : 'STARTGAME_START_REPROMPT_NONAME');
      buttons.turnOffButtons(handlerInput);
    }

    // OK, set the button up for betting mode - flashing different colors
    buttons.lightPlayer(handlerInput);
    speech += reprompt;
    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .getResponse();
  },
};
