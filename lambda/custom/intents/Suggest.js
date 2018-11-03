//
// Gives the player a suggestion
//

'use strict';

const utils = require('../utils');
const speechUtils = require('alexa-speech-utils')();
const {ri} = require('@jargon/alexa-skill-sdk');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];

    return ((request.type === 'IntentRequest') &&
      (request.intent.name === 'SuggestIntent') &&
      !game.handOver && !attributes.temp.newGame);
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];
    let speech;
    const speechParams = {};

    // Get a suggestion for this hand
    attributes.temp.suggestion = utils.suggestedPlay(game.player.cards);
    if (attributes.temp.suggestion.length) {
      const cardText = [];
      attributes.temp.suggestion.forEach((card) => {
        cardText.push(utils.sayCard(handlerInput, game.player.cards[card]));
      });
      speech = 'SUGGEST_CARDS';
      speechParams.Cards = speechUtils.and(cardText, {locale: event.request.locale});
    } else {
      speech = 'SUGGEST_DISCARD_ALL';
    }

    return handlerInput.jrb
      .speak(ri(speech, speechParams))
      .reprompt(ri('SUGGEST_REPROMPT'))
      .getResponse();
  },
};
