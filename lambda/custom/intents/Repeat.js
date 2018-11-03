//
// Say that again?
//

'use strict';

const utils = require('../utils');
const speechUtils = require('alexa-speech-utils')();
const {ri} = require('@jargon/alexa-skill-sdk');

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
    let speech = 'REPEAT';
    let cards;
    const speechParams = {};

    speechParams.Chips = attributes.points;
    return utils.readHandRank(handlerInput, game.player)
    .then((hand) => {
      // Start with what the player has
      cards = utils.mapHand(game, game.player).map((x) => {
        return utils.sayCard(handlerInput, x);
      });
      speechParams.Cards = speechUtils.and(cards, {locale: event.request.locale});
      speechParams.Hand = hand;

      // If the hand isn't over, tell them what they are holding
      if (!game.handOver && game.player.hold && game.player.hold.length) {
        const heldCards = [];
        game.player.hold.forEach((x) => {
          heldCards.push(utils.sayCard(handlerInput, game.player.cards[x]));
        });

        speech += '_HOLDING';
        speechParams.HoldCards = speechUtils.and(heldCards, {locale: event.request.locale});
      }

      // Now read the opponent hand - either one card or the whole hand
      if (game.handOver) {
        // Whole hand
        speech += '_OPPONENT_HAND';
        return utils.readHandRank(handlerInput, game.opponent);
      } else {
        // Just read the opponent up card
        speech += '_UPCARD';
        return;
      }
    }).then((opponentHand) => {
      speechParams.OpponentName = game.opponent.name;
      if (opponentHand) {
        cards = utils.mapHand(game, game.opponent).map((x) => {
          return utils.sayCard(handlerInput, x);
        });
        speechParams.OpponentCards = speechUtils.and(cards, {locale: event.request.locale});
        speechParams.OpponentHand = opponentHand;
      } else {
        speechParams.OpponentCard = utils.sayCard(handlerInput, game.opponent.cards[0]);
      }

      return handlerInput.jrb
        .speak(ri(speech, speechParams))
        .reprompt(ri('REPEAT_REPROMPT'))
        .getResponse();
    });
  },
};
