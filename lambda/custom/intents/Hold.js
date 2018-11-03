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
    let speech;
    let reprompt;
    const willHold = (((event.request.type === 'GameEngine.InputHandlerEvent')
      && (attributes.temp.buttons.hold === attributes.temp.buttonId))
      || ((event.request.type === 'IntentRequest')
      && ((event.request.intent.name === 'AMAZON.YesIntent')
        || (event.request.intent.name === 'AMAZON.NextIntent'))));
    const goBack = ((event.request.type === 'IntentRequest') &&
      ((event.request.intent.name === 'AMAZON.PreviousIntent')
        || (event.request.intent.name === 'AMAZON.CancelIntent')));
    let holdArray;
    let promise;
    const speechParams = {};
    let repromptParams = {};

    if (attributes.temp.suggestion) {
      holdArray = attributes.temp.suggestion;
      attributes.temp.suggestion = undefined;
    } else if (Array.isArray(attributes.temp.holding)) {
      holdArray = attributes.temp.holding;
    }

    // If they pressed a button, give a verbal indication of what they did
    if (event.request.type === 'GameEngine.InputHandlerEvent') {
      const cards = [];
      if (holdArray) {
        holdArray.forEach((held) => {
          cards.push(utils.sayCard(handlerInput, game.player.cards[held]));
        });
      } else {
        cards.push(utils.sayCard(handlerInput, game.player.cards[attributes.temp.holding]));
      }

      const params = {};
      params.Card = speechUtils.and(cards, {locale: event.request.locale});
      const buttonSpeech = (willHold) ? 'HOLD_BUTTON_HELD' : 'HOLD_BUTTON_DISCARD';
      return handlerInput.jrm.render(ri(buttonSpeech, params));
    } else {
      promise = Promise.resolve('');
    }

    return promise.then((text) => {
      speechParams.ButtonText = text;
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

        speech = 'HOLD_PREVIOUS_CARD';
        speechParams.Card = utils.sayCard(handlerInput, game.player.cards[attributes.temp.holding]);
        reprompt = 'HOLD_REPROMPT_CARD';
        repromptParams = Object.assign({}, speechParams);
        return '';
      } else if (holdArray) {
        if (willHold) {
          game.player.hold = holdArray;
          attributes.temp.holding = undefined;
          speech = 'HOLD_GAMEOVER';
          reprompt = 'HOLD_GAMEOVER_REPROMPT';
          return finishHand(handlerInput);
        } else {
          // Ask card by card
          attributes.temp.holding = 0;
          speech = 'HOLD_NEXT_CARD';
          speechParams.Card =
            utils.sayCard(handlerInput, game.player.cards[attributes.temp.holding]);
          reprompt = 'HOLD_REPROMPT_CARD';
          repromptParams = Object.assign({}, speechParams);
          return '';
        }
      } else {
        // OK, are they holding this one?
        if (willHold) {
          game.player.hold.push(attributes.temp.holding);
        }

        attributes.temp.holding++;
        if (attributes.temp.holding < 3) {
          // Next one
          speech = 'HOLD_NEXT_CARD';
          speechParams.Card =
            utils.sayCard(handlerInput, game.player.cards[attributes.temp.holding]);
          reprompt = 'HOLD_REPROMPT_CARD';
          repromptParams = Object.assign({}, speechParams);
          return '';
        } else {
          speech = 'HOLD_GAMEOVER';
          reprompt = 'HOLD_GAMEOVER_REPROMPT';
          return finishHand(handlerInput);
        }
      }
    }).then((finishText) => {
      // You are out of points - come back tomorrow
      let directive = '';
      speechParams.Result = finishText;
      if (attributes.points === 0) {
        attributes.busted = Date.now();
        if (attributes.paid && attributes.paid.morehands) {
          // Offer to buy more chips
          speechParams.Chips = utils.PURCHASE_REFRESH_POINTS;
          speech += '_UPSELL';
          directive = handlerInput.jrm.renderItem(ri(speech, speechParams));
        } else {
          speech += '_NOCHIPS';
          reprompt = undefined;
        }
      }
      return directive;
    }).then((directive) => {
      if (directive) {
        directive.payload.InSkillProduct.productId = attributes.paid.coinreset.productId;
        handlerInput.jrb.addDirective(directive);
        return handlerInput.jrb
          .withShouldEndSession(true)
          .getResponse();
      } else {
        if (reprompt) {
          return handlerInput.jrb
            .speak(ri(speech, speechParams))
            .reprompt(ri(reprompt, repromptParams))
            .getResponse();
        } else {
          return handlerInput.jrb
            .speak(ri(speech, speechParams))
            .withShouldEndSession(true)
            .getResponse();
        }
      }
    });
  },
};

function finishHand(handlerInput) {
  // Reveal the result
  const event = handlerInput.requestEnvelope;
  const attributes = handlerInput.attributesManager.getSessionAttributes();
  const game = attributes[attributes.currentGame];
  const drew = [];
  const opponentDrew = [];
  const opponentHeld = [];
  let i;
  let speech;
  const speechParams = {};
  let result;

  game.handOver = true;
  return utils.readHandRank(handlerInput, game.player)
  .then((hand) => {
    const playerParams = {};
    playerParams.Hand = hand;
    speech = 'HOLD_RESULT_PLAYER';
    for (i = 3; i < 6 - game.player.hold.length; i++) {
      drew.push(game.player.cards[i]);
    }
    if (drew.length) {
      const cards = drew.map((x) => {
        return utils.sayCard(handlerInput, x);
      });
      speech += '_DREW';
      playerParams.Card = speechUtils.and(cards, {locale: event.request.locale});
    }

    return handlerInput.jrm.render(ri(speech, playerParams));
  }).then((playerResult) => {
    speechParams.PlayerResult = playerResult;
    return utils.readHandRank(handlerInput, game.opponent);
  }).then((opponentResult) => {
    const opponentParams = {};
    const opponent = game.opponent.cards.slice(0, 3).map((x) => {
      return utils.sayCard(handlerInput, x);
    });

    for (i = 3; i < 6 - game.opponent.hold.length; i++) {
      opponentDrew.push(game.opponent.cards[i]);
    }
    game.opponent.hold.forEach((heldCard) => {
      opponentHeld.push(game.opponent.cards[heldCard]);
    });

    speech = 'HOLD_RESULT_OPPONENT';
    opponentParams.OpponentResult = opponentResult;
    opponentParams.OpponentHand = speechUtils.and(opponent, {locale: event.request.locale});
    opponentParams.OpponentName = game.opponent.name;
    if (opponentHeld.length === 3) {
      speech += '_HOLDALL';
    } else if (opponentHeld.length > 0) {
      const cards = opponentHeld.map((x) => {
        return utils.sayCard(handlerInput, x);
      });
      speech += '_HELD';
      opponentParams.OpponentHoldCards = speechUtils.and(cards, {locale: event.request.locale});
    } else {
      speech += '_DISCARDALL';
    }

    if (opponentDrew.length) {
      const cards = opponentDrew.map((x) => {
        return utils.sayCard(handlerInput, x);
      });
      opponentParams.OpponentDrawCards = speechUtils.and(cards, {locale: event.request.locale});
    }
    return handlerInput.jrm.render(ri(speech, opponentParams));
  }).then((opponentResult) => {
    speechParams.OpponentResult = opponentResult;
    const winParams = {};
    let winSpeech;

    // And what's the result?
    winParams.Name = (attributes.name) ? attributes.name : '';
    result = utils.determineWinner(game);
    if (result === 'player') {
      winSpeech = 'HOLD_RESULT_WIN_PLAYER';
      attributes.points++;
    } else if (result === 'opponent') {
      winSpeech = 'HOLD_RESULT_WIN_OPPONENT';
      attributes.points--;
    } else {
      winSpeech = 'HOLD_RESULT_WIN_TIE';
      attributes.points--;
    }
    attributes.temp.holding = undefined;
    winParams.Chips = attributes.points;
    return handlerInput.jrm.render(ri(winSpeech, winParams));
  }).then((winText) => {
    speechParams.WinText = winText;

    // Is it a new high?
    if (attributes.points > attributes.high) {
      attributes.high = attributes.points;
      utils.updateLeaderBoard(handlerInput);
    }

    // Save the result to S3
    return utils.saveHand(handlerInput);
  }).then(() => {
    let offerSuggestion;

    // We should suggest if they didn't win and haven't
    // and didn't follow the recommended action and
    // haven't asked for a suggestion in the past week
    if ((result !== 'player') &&
      (!attributes.prompts.suggestion ||
      ((Date.now() - attributes.prompts.suggestion) > 7*24*60*60*1000))) {
      // Did they follow the recommended play?  If not, take note
      const suggestion = utils.suggestedPlay(game.player.cards);
      if (JSON.stringify(suggestion) !== JSON.stringify(game.player.hold)) {
        attributes.prompts.suggestion = Date.now();
        offerSuggestion = true;
      }
    }

    if (offerSuggestion) {
      speechParams.Name = (attributes.name) ? attributes.name : '';
      return handlerInput.jrm.render(ri('HOLD_RESULT_SUGGESTION', speechParams));
    } else {
      return handlerInput.jrm.render(ri('HOLD_RESULT', speechParams));
    }
  });
}
