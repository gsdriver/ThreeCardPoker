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
    let response;
    let output;

    // Are they holding all?
    if (attributes.temp.holdingAll) {
      attributes.temp.holdingAll = undefined;
      if (event.request.intent.name === 'AMAZON.YesIntent') {
        game.player.hold = [0, 1, 2];
        output = finishHand(handlerInput);
        speech = output.speech;
        reprompt = output.reprompt;
      } else {
        // Ask card by card
        attributes.temp.holding = 0;
        speech = res.getString('HOLD_NEXTCARD')
          .replace('{0}', res.readCard(game.player.cards[attributes.temp.holding]));
        reprompt = speech;
      }
    } else {
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
        output = finishHand(handlerInput);
        speech = output.speech;
        reprompt = output.reprompt;
      }
    }

    // You are out of points - come back tomorrow
    if (attributes.points === 0) {
      attributes.busted = Date.now();
      if (attributes.paid && attributes.paid.morehands) {
        response = handlerInput.responseBuilder
          .addDirective(utils.getPurchaseDirective(attributes, 'Upsell', speech))
          .withShouldEndSession(true)
          .getResponse();
      } else {
        response = handlerInput.responseBuilder
          .speak(speech)
          .withShouldEndSession(true)
          .getResponse();
      }
    } else {
      response = handlerInput.responseBuilder
        .speak(speech)
        .reprompt(reprompt)
        .getResponse();
    }

    return response;
  },
};

function finishHand(handlerInput) {
  // Reveal the result
  const event = handlerInput.requestEnvelope;
  const attributes = handlerInput.attributesManager.getSessionAttributes();
  const game = attributes[attributes.currentGame];
  const res = require('../resources')(handlerInput);
  const drew = [];
  const opponentDrew = [];
  const opponentHeld = [];
  let i;
  let speech;
  let reprompt;

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
  speech += res.getString('HOLD_PLAYER_RESULT')
    .replace('{0}', utils.readHandRank(handlerInput, game.player));

  const opponent = game.opponent.cards.slice(0, 3).map((x) => {
    return res.readCard(x);
  });
  for (i = 3; i < 6 - game.opponent.hold.length; i++) {
    opponentDrew.push(game.opponent.cards[i]);
  }
  game.opponent.hold.forEach((heldCard) => {
    opponentHeld.push(game.opponent.cards[heldCard]);
  });

  speech += res.getString('HOLD_OPPONENT')
    .replace('{0}', speechUtils.and(opponent, {locale: event.request.locale}))
    .replace('{1}', game.opponent.name);
  if (opponentHeld.length === 3) {
    speech += res.getString('HOLD_OPPONENT_HOLDALL').replace('{1}', game.opponent.name);
  } else if (opponentHeld.length > 0) {
    const cards = opponentHeld.map((x) => {
      return res.readCard(x);
    });
    speech += res.getString('HOLD_OPPONENT_HELD')
      .replace('{0}', speechUtils.and(cards, {locale: event.request.locale}))
      .replace('{1}', game.opponent.name);
  } else {
    speech += res.getString('HOLD_OPPONENT_DISCARDALL').replace('{1}', game.opponent.name);
  }
  if (opponentDrew.length) {
    const cards = opponentDrew.map((x) => {
      return res.readCard(x);
    });
    speech += res.getString('HOLD_OPPONENT_DREW')
      .replace('{0}', speechUtils.and(cards, {locale: event.request.locale}))
      .replace('{1}', game.opponent.name);
  }
  speech += res.getString('HOLD_OPPONENT_RESULT')
    .replace('{0}', utils.readHandRank(handlerInput, game.opponent));

  // And what's the result?
  const result = utils.determineWinner(game);
  if (result === 'player') {
    speech += res.getString('HOLD_WIN');
    attributes.points++;
  } else if (result === 'opponent') {
    speech += res.getString('HOLD_LOSE');
    attributes.points--;
  } else {
    speech += res.getString('HOLD_TIE');
    attributes.points--;
  }
  speech += res.getString('HANDS_LEFT').replace('{0}', attributes.points);
  attributes.temp.holding = undefined;

  // Add reprompt if they still have points
  if (attributes.points > 0) {
    reprompt = res.getString('HOLD_GAMEOVER_REPROMPT');
    speech += reprompt;
  }

  return {speech: speech, reprompt: reprompt};
}
