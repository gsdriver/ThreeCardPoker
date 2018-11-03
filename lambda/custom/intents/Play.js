//
// Starts a game
//

'use strict';

const utils = require('../utils');
const speechUtils = require('alexa-speech-utils')();
const buttons = require('../buttons');
const {ri} = require('@jargon/alexa-skill-sdk');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    return ((request.type === 'IntentRequest') &&
      ((request.intent.name === 'PlayIntent')
        || ((request.intent.name === 'AMAZON.YesIntent') && !attributes.temp.newGame))
      && (attributes.temp.holding === undefined));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];

    return utils.deal(handlerInput)
    .then(() => {
      return utils.readHandRank(handlerInput, game.player);
    }).then((handRank) => {
      game.timestamp = Date.now();
      // Read what you have, and the other player's first card
      const cards = game.player.cards.slice(0, 3).map((x) => {
        return utils.sayCard(handlerInput, x);
      });
      const details = utils.evaluateHand(game, game.player);
      const speechParams = {};
      const repromptParams = {};
      let reprompt;
      let speech;

      speechParams.Cards = speechUtils.and(cards, {locale: event.request.locale});
      speechParams.OpponentName = game.opponent.name;
      speechParams.OpponentHand = utils.sayCard(handlerInput, game.opponent.cards[0]);
      speechParams.Hand = handRank;

      if (details.cards.length > 0) {
        speech = 'PLAY_READ_HAND_HOLDALL';
        reprompt = 'PLAY_HOLDALL_REPROMPT';
        repromptParams.Hand = handRank;
        attributes.temp.holding = [];
        details.cards.forEach((card) => {
          attributes.temp.holding.push(game.player.cards.indexOf(card));
        });
      } else {
        speech = 'PLAY_READ_HAND';
        reprompt = 'PLAY_REPROMPT';
        speechParams.FirstCard = utils.sayCard(handlerInput, game.player.cards[0]);
        repromptParams.Card = utils.sayCard(handlerInput, game.player.cards[0]);
        attributes.temp.holding = 0;
      }

      // Now we are going into holding mode
      buttons.playInputHandler(handlerInput);
      buttons.lightPlayer(handlerInput);
      attributes.temp.newGame = undefined;
      return handlerInput.jrb
        .speak(ri(speech, speechParams))
        .reprompt(ri(reprompt, repromptParams))
        .getResponse();
    });
  },
};
