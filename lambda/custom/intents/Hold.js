//
// Starts a game
//

'use strict';

const utils = require('../utils');
const speechUtils = require('alexa-speech-utils')();
const buttons = require('../buttons');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    if ((request.type === 'GameEngine.InputHandlerEvent') && !attributes.temp.newGame) {
      attributes.temp.buttonId = buttons.getPressedButton(request);
      return (attributes.temp.buttons && attributes.temp.buttons.hold
        && attributes.temp.buttons.discard
        && ((attributes.temp.buttons.hold === attributes.temp.buttonId) ||
          (attributes.temp.buttons.discard === attributes.temp.buttonId)));
    }

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
    const willHold = (((event.request.type === 'GameEngine.InputHandlerEvent')
      && (attributes.temp.buttons.hold === attributes.temp.buttonId))
      || ((event.request.type === 'IntentRequest')
      && (event.request.intent.name === 'AMAZON.YesIntent')));

    return new Promise((resolve, reject) => {
      // Are they holding all?
      if (Array.isArray(attributes.temp.holding)) {
        if (willHold) {
          game.player.hold = attributes.temp.holding;
          attributes.temp.holding = undefined;
          finishHand(handlerInput, (endSpeech, endReprompt) => {
            speech = endSpeech;
            reprompt = endReprompt;
            done();
          });
        } else {
          // Ask card by card
          attributes.temp.holding = 0;
          speech = res.getString('HOLD_NEXTCARD')
            .replace('{0}', res.readCard(game.player.cards[attributes.temp.holding]));
          reprompt = speech;
          done();
        }
      } else {
        // OK, are they holding this one?
        if (willHold) {
          game.player.hold.push(attributes.temp.holding);
        }

        attributes.temp.holding++;
        if (attributes.temp.holding < 3) {
          // Next one
          speech = res.getString('HOLD_NEXTCARD')
            .replace('{0}', res.readCard(game.player.cards[attributes.temp.holding]));
          reprompt = speech;
          done();
        } else {
          finishHand(handlerInput, (endSpeech, endReprompt) => {
            speech = endSpeech;
            reprompt = endReprompt;
            done();
          });
        }
      }

      function done() {
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

        resolve(response);
      }
    });
  },
};

function finishHand(handlerInput, callback) {
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
  game.handOver = true;

  // Is it a new high?
  if (attributes.points > attributes.high) {
    attributes.high = attributes.points;
    utils.updateLeaderBoard(handlerInput);
  }

  // Add reprompt if they still have points
  if (attributes.points > 0) {
    reprompt = res.getString('HOLD_GAMEOVER_REPROMPT');
    speech += reprompt;
  }

  // Save the result to S3
  utils.saveHand(handlerInput, () => {
    callback(speech, reprompt);
  });
}
