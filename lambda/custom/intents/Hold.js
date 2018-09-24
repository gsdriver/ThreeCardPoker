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
      (attributes.temp.holding !== undefined) &&
      ((request.intent.name === 'AMAZON.NoIntent')
      || (request.intent.name === 'AMAZON.YesIntent')));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];
    const res = require('../resources')(handlerInput);
    let speech;
    let reprompt;

    // OK, are they holding this one?
    if (event.request.intent.name === 'AMAZON.YesIntent') {
      game.player.hold.push(attributes.temp.holding);
    }

    attributes.temp.holding++;
    if (attributes.temp.holding < 3) {
      // Next one
      speech = res.getString('HOLD_NEXTCARD')
        .replace('{0}', res.readCard(game.player.cards[attributes.temp.holding]));
      reprompt = speech;
    } else {
      // Reveal the result
      const drew = [];
      const opponentDrew = [];
      const opponentHeld = [];
      let i;

      speech = '';
      for (i = 3; i < 6 - game.player.hold.length; i++) {
        drew.push(game.player.cards[i]);
      }
      if (drew.length) {
        const cards = drew.map((x) => {
          return res.readCard(x);
        });
        speech += res.getString('HOLD_DREW').replace('{0}', speechUtils.and(cards, {locale: event.request.locale}));
      }

      const opponent = game.opponent.cards.slice(0, 3).map((x) => {
        return res.readCard(x);
      });
      for (i = 3; i < 6 - game.opponent.hold.length; i++) {
        opponentDrew.push(game.opponent.cards[i]);
      }
      game.opponent.hold.forEach((heldCard) => {
        opponentHeld.push(game.opponent.cards[heldCard]);
      });

      speech += res.getString('HOLD_OPPONENT').replace('{0}', speechUtils.and(opponent, {locale: event.request.locale}));
      if (opponentHeld.length === 3) {
        speech += res.getString('HOLD_OPPONENT_HOLDALL');
      } else if (opponentHeld.length > 0) {
        const cards = opponentHeld.map((x) => {
          return res.readCard(x);
        });
        speech += res.getString('HOLD_OPPONENT_HELD').replace('{0}', speechUtils.and(cards, {locale: event.request.locale}));
      } else {
        speech += res.getString('HOLD_OPPONENT_DISCARDALL');
      }
      if (opponentDrew.length) {
        const cards = opponentDrew.map((x) => {
          return res.readCard(x);
        });
        speech += res.getString('HOLD_OPPONENT_DREW').replace('{0}', speechUtils.and(cards, {locale: event.request.locale}));
      }

      // And what's the result?
      const result = utils.determineWinner(game);
      if (result === 'player') {
        speech += res.getString('HOLD_WIN');
      } else if (result === 'opponent') {
        speech += res.getString('HOLD_LOSE');
      } else {
        speech += res.getString('HOLD_TIE');
      }
      reprompt = res.getString('HOLD_GAMEOVER_REPROMPT');
      speech += reprompt;
      attributes.temp.holding = undefined;
    }

    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .getResponse();
  },
};
