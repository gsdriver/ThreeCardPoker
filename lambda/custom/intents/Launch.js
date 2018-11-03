//
// Handles opening the skill
//

'use strict';

const utils = require('../utils');
const buttons = require('../buttons');
const {ri} = require('@jargon/alexa-skill-sdk');

module.exports = {
  canHandle: function(handlerInput) {
    return handlerInput.requestEnvelope.session.new ||
      (handlerInput.requestEnvelope.request.type === 'LaunchRequest');
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let response;
    let speech = 'LAUNCH';
    let reprompt;
    const speechParams = {};

    return utils.getGreeting(handlerInput)
    .then((greeting) => {
      // First off - are they out of money?
      speechParams.Greeting = greeting;
      if (attributes.busted) {
        // Is it the next day or not?
        return utils.isNextDay(event, attributes);
      } else {
        return 'nobust';
      }
    }).then((nextDay) => {
      if (nextDay === 'nobust') {
        return 'continue';
      } else if (!nextDay) {
        // Here's the place to do an upsell if we can!
        if (!attributes.temp.noUpsell && attributes.paid && attributes.paid.morehands) {
          speechParams.Chips = utils.DAILY_REFRESH_POINTS;
          speechParams.ExtraChips = utils.PURCHASE_REFRESH_POINTS;
          speech += '_BUSTED_UPSELL';
          return handlerInput.jrm.renderItem(ri(speech, speechParams));
        } else {
          speech += '_BUSTED';
          speechParams.Chips = utils.DAILY_REFRESH_POINTS;
          response = handlerInput.jrb
            .speak(ri(speech, speechParams))
            .withShouldEndSession(true)
            .getResponse();
          return 'exit';
        }
      } else {
        speech = 'LAUNCH_BUSTED_REPLENISH';
        speechParams.Chips = utils.DAILY_REFRESH_POINTS;
        speechParams.Name = (attributes.name ? attributes.name: '');
        attributes.points += utils.DAILY_REFRESH_POINTS;
        attributes.busted = undefined;
        return 'continue';
      }
    }).then((directive) => {
      if (typeof directive !== 'string') {
        directive.payload.InSkillProduct.productId = attributes.paid.coinreset.productId;
        handlerInput.jrb.addDirective(directive);
        response = handlerInput.jrb
          .withShouldEndSession(true)
          .getResponse();
        return 'exit';
      } else {
        return directive;
      }
    }).then((action) => {
      if (action === 'continue') {
        attributes.temp.newGame = true;
        if (speech === 'LAUNCH') {
          if (attributes.name) {
            speech += '_WELCOME_BACK';
            speechParams.Name = attributes.name;
            reprompt = 'LAUNCH_RETURNING_REPRONPT';
          } else {
            speech += '_WELCOME';
            reprompt = 'LAUNCH_REPROMPT';
          }
        }
        if (buttons.supportButtons(handlerInput)) {
          reprompt += '_BUTTON';
          speech += '_BUTTON';
        }

        response = handlerInput.jrb
          .speak(ri(speech, speechParams))
          .reprompt(ri(reprompt))
          .getResponse();
      }

      return response;
    });
  },
};
