//
// Say that again?
//

'use strict';

const utils = require('../utils');
const speechUtils = require('alexa-speech-utils')();

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest')
      && (request.intent.name === 'AMAZON.RepeatIntent'));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];
    const res = require('../resources')(handlerInput);
    let speech = '';
    let cards;
    let handRank;

    // Tell them their chip balance
    speech += res.getString('CHIPS_LEFT').replace('{0}', res.sayChips(attributes.points));
    // Start with what the player has
    cards = utils.mapHand(game, game.player).map((x) => {
      return res.readCard(x);
    });
    handRank = utils.readHandRank(handlerInput, game.player);
    speech += res.getString('REPEAT_READ_HAND')
      .replace('{0}', speechUtils.and(cards, {locale: event.request.locale}))
      .replace('{1}', handRank);

    // If the hand isn't over, tell them what they are holding
    if (!game.handOver && game.player.hold && game.player.hold.length) {
      const heldCards = [];
      game.player.hold.forEach((x) => {
        heldCards.push(res.readCard(game.player.cards[x]));
      });
      speech += res.getString('REPEAT_PLAYER_HOLDING')
        .replace('{0}', speechUtils.and(heldCards, {locale: event.request.locale}));
    }

    // Now read the opponent hand - either one card or the whole hand
    if (game.handOver) {
      // Whole hand
      cards = utils.mapHand(game, game.opponent).map((x) => {
        return res.readCard(x);
      });
      handRank = utils.readHandRank(handlerInput, game.opponent);
      speech += res.getString('REPEAT_READ_OPPONENT_HAND')
        .replace('{0}', game.opponent.name)
        .replace('{1}', speechUtils.and(cards, {locale: event.request.locale}))
        .replace('{2}', handRank);
    } else {
      // Just read the opponent up card
      speech += res.getString('REPEAT_UPCARD')
        .replace('{0}', game.opponent.name)
        .replace('{1}', res.readCard(game.opponent.cards[0]));
    }

    const reprompt = res.getString('REPEAT_REPROMPT');
    speech += reprompt;
    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(reprompt)
      .getResponse();
  },
};
