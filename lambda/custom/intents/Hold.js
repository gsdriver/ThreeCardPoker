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
      attributes.temp.buttonId = buttons.getPressedButton(handlerInput);
      return (attributes.temp.buttons && attributes.temp.buttons.hold
        && attributes.temp.buttons.discard
        && ((attributes.temp.buttons.hold === attributes.temp.buttonId) ||
          (attributes.temp.buttons.discard === attributes.temp.buttonId)));
    }

    return ((request.type === 'IntentRequest') &&
      (attributes.temp.holding !== undefined) &&
      (((request.intent.name === 'AMAZON.NoIntent')
      || (request.intent.name === 'AMAZON.YesIntent')
      || (request.intent.name === 'AMAZON.PreviousIntent')
      || (request.intent.name === 'AMAZON.NextIntent'))
      || ((attributes.temp.holding !== 0)
        && (request.intent.name === 'AMAZON.CancelIntent'))));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];
    const res = require('../resources')(handlerInput);
    let speech = '';
    let reprompt;
    let response;
    const willHold = (((event.request.type === 'GameEngine.InputHandlerEvent')
      && (attributes.temp.buttons.hold === attributes.temp.buttonId))
      || ((event.request.type === 'IntentRequest')
      && ((event.request.intent.name === 'AMAZON.YesIntent')
        || (event.request.intent.name === 'AMAZON.NextIntent'))));
    const goBack = ((event.request.type === 'IntentRequest') &&
      ((event.request.intent.name === 'AMAZON.PreviousIntent')
        || (event.request.intent.name === 'AMAZON.CancelIntent')));

    return new Promise((resolve, reject) => {
      // If they pressed a button, give a verbal indication of what they did
      if (event.request.type === 'GameEngine.InputHandlerEvent') {
        const cards = [];
        if (Array.isArray(attributes.temp.holding)) {
          attributes.temp.holding.forEach((held) => {
            cards.push(res.readCard(game.player.cards[held]));
          });
        } else {
          cards.push(res.readCard(game.player.cards[attributes.temp.holding]));
        }

        if (willHold) {
          speech = '<audio src="soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_neutral_response_01"/> ';
          speech += res.getString('HOLD_BUTTON_HELD')
            .replace('{0}', speechUtils.and(cards, {locale: event.request.locale}));
        } else {
          speech += '<audio src="soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_player1_01"/> ';
          speech += res.getString('HOLD_BUTTON_DISCARD')
            .replace('{0}', speechUtils.and(cards, {locale: event.request.locale}));
        }
      }

      // Do they want to go back?
      if (goBack) {
        if (Array.isArray(attributes.temp.holding)) {
          attributes.temp.holding = 0;
        } else {
          // Remove this from the hold array
          if (attributes.temp.holding > 0) {
            attributes.temp.holding--;
          }
          game.player.hold = game.player.hold.filter((x) => {
            return (x !== attributes.temp.holding);
          });
        }

        speech = res.getString('HOLD_PREVIOUS_CARD')
          .replace('{0}', res.readCard(game.player.cards[attributes.temp.holding]));
        reprompt = speech;
        done();
      } else if (Array.isArray(attributes.temp.holding)) {
        if (willHold) {
          game.player.hold = attributes.temp.holding;
          attributes.temp.holding = undefined;
          finishHand(handlerInput, (endSpeech, endReprompt) => {
            speech += endSpeech;
            reprompt = endReprompt;
            done();
          });
        } else {
          // Ask card by card
          attributes.temp.holding = 0;
          speech += res.getString('HOLD_NEXT_CARD')
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
          speech += res.getString('HOLD_NEXT_CARD')
            .replace('{0}', res.readCard(game.player.cards[attributes.temp.holding]));
          reprompt = speech;
          done();
        } else {
          finishHand(handlerInput, (endSpeech, endReprompt) => {
            speech += endSpeech;
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
            // Strip out breaks and offer to buy more chips
            speech += res.getString('HOLD_BUY_CHIPS').replace('{0}', utils.PURCHASE_REFRESH_POINTS);
            speech = speech.replace(/<break[^>]+>/g, ' ');
            speech = speech.replace(/<\/?[^>]+(>|$)/g, '');
            speech = speech.replace(/\s+/g, ' ').trim();

            response = handlerInput.responseBuilder
              .addDirective(utils.getPurchaseDirective(attributes, 'Upsell', speech))
              .withShouldEndSession(true)
              .getResponse();
          } else {
            speech += res.getString('HOLD_NO_CHIPS');
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

  game.handOver = true;
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
    speech += res.getString('HOLD_WIN').replace('{0}', (attributes.name ? attributes.name : ''));
    attributes.points++;
  } else if (result === 'opponent') {
    speech += res.getString('HOLD_LOSE').replace('{0}', (attributes.name ? attributes.name : ''));
    attributes.points--;
  } else {
    speech += res.getString('HOLD_TIE');
    attributes.points--;
  }
  speech += res.getString('CHIPS_LEFT').replace('{0}', res.sayChips(attributes.points));
  attributes.temp.holding = undefined;

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
