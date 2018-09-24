//
// Starts a game
//

'use strict';

const utils = require('../utils');
const speechUtils = require('alexa-speech-utils')();

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    return ((request.type === 'IntentRequest') &&
      ((request.intent.name === 'PlayIntent')
      || ((request.intent.name === 'AMAZON.YesIntent') && !attributes.temp.newGame
        && (attributes.temp.holding === undefined))));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];
    const res = require('../resources')(handlerInput);

    utils.deal(handlerInput);
    game.timestamp = Date.now();
    // Read what you have, and the other player's first card
    const cards = game.player.cards.slice(0, 3).map((x) => {
      return res.readCard(x);
    });
    let speech = res.getString('PLAY_READ_HAND')
      .replace('{0}', speechUtils.and(cards, {locale: event.request.locale}))
      .replace('{1}', game.opponent.name)
      .replace('{2}', res.readCard(game.opponent.cards[0]));
    const reprompt = res.getString('PLAY_REPRONPT').replace('{0}', res.readCard(game.player.cards[0]));
    speech += ('<break time=\'300ms\'/> ' + reprompt);

    // Now we are going into holding mode
    attributes.temp.newGame = undefined;
    attributes.temp.holding = 0;
    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .getResponse();
  },
};
