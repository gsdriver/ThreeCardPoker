//
// Starts the game when the user presses an Echo Button
//

'use strict';

const buttons = require('../buttons');
const {ri} = require('@jargon/alexa-skill-sdk');

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
      attributes.temp.buttonId = buttons.getPressedButton(handlerInput);
      return (attributes.temp.buttonId && (!attributes.temp.buttons
        || (attributes.temp.buttons.hold !== attributes.temp.buttonId)));
    }

    return false;
  },
  handle: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let speech;
    let reprompt;
    const speechParams = {};

    // Save this button
    attributes.usedButton = true;
    if (!attributes.temp.buttons) {
      attributes.temp.buttons = {};
    }
    if (!attributes.temp.buttons.hold) {
      attributes.temp.buttons.hold = attributes.temp.buttonId;
      speechParams.Name = (attributes.name) ? attributes.name : '';

      // Turn off the microphone until they press the second button
      buttons.secondButtonInputHandler(handlerInput);
      handlerInput.jrb
        .speak(ri('STARTGAME_PRESS_DISCARD', speechParams))
        .withShouldEndSession(undefined);
    } else {
      attributes.temp.buttons.discard = attributes.temp.buttonId;
      speech = 'STARTGAME_START';
      if (attributes.name) {
        reprompt = 'STARTGAME_START_REPROMPT';
      } else {
        reprompt = 'STARTGAME_START_REPROMPT_NONAME';
        speech += '_NONAME';
      }
      buttons.turnOffButtons(handlerInput);
      handlerInput.jrb
        .speak(ri(speech))
        .reprompt(ri(reprompt));
    }

    // OK, set the button up for betting mode - flashing different colors
    buttons.lightPlayer(handlerInput);
    return handlerInput.jrb.getResponse();
  },
};
