//
// Handles opening the skill
//

'use strict';

const utils = require('../utils');
const buttons = require('../buttons');

module.exports = {
  canHandle: function(handlerInput) {
    return handlerInput.requestEnvelope.session.new ||
      (handlerInput.requestEnvelope.request.type === 'LaunchRequest');
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(handlerInput);
    let response;
    let speech;
    let reprompt = '';

    return new Promise((resolve, reject) => {
      // First off - are they out of money?
      if (attributes.busted) {
        // Is it the next day or not?
        utils.isNextDay(event, attributes, (nextDay) => {
          if (!nextDay) {
            // Here's the place to do an upsell if we can!
            if (!attributes.temp.noUpsell && attributes.paid && attributes.paid.morehands) {
              handlerInput.responseBuilder
                .addDirective(utils.getPurchaseDirective(attributes, 'Upsell',
                  res.getString('LAUNCH_BUSTED_UPSELL')
                    .replace('{Chips}', utils.DAILY_REFRESH_POINTS)
                    .replace('{ExtraChips}', utils.PURCHASE_REFRESH_POINTS)));
            } else {
              handlerInput.responseBuilder
                .speak(res.getString('LAUNCH_BUSTED').replace('{Chips}', utils.DAILY_REFRESH_POINTS));
            }
            response = handlerInput.responseBuilder
              .withShouldEndSession(true)
              .getResponse();
            resolve(response);
            return;
          } else {
            speech = res.getString('LAUNCH_BUSTED_REPLENISH')
              .replace('{Chips}', utils.DAILY_REFRESH_POINTS)
              .replace('{Name}', (attributes.name ? attributes.name: ''));
            attributes.points += utils.DAILY_REFRESH_POINTS;
            attributes.busted = undefined;
            finishResponse();
          }
        });
      } else {
        finishResponse();
      }

      function finishResponse() {
        utils.getGreeting(handlerInput, (greeting) => {
          attributes.temp.newGame = true;
          if (!speech) {
            if (attributes.name) {
              speech = res.getString('LAUNCH_WELCOME_BACK')
                .replace('{Greeting}', greeting)
                .replace('{Name}', attributes.name);
              reprompt += res.getString('LAUNCH_RETURNING_REPRONPT');
            } else {
              speech = res.getString('LAUNCH_WELCOME')
                .replace('{Greeting}', greeting);
              reprompt += res.getString('LAUNCH_REPROMPT');
            }
          }
          if (buttons.supportButtons(handlerInput)) {
            reprompt += res.getString('LAUNCH_REPROMPT_BUTTON');
          }
          speech += reprompt;

          response = handlerInput.responseBuilder
            .speak(speech)
            .reprompt(reprompt)
            .getResponse();
          resolve(response);
        });
      }
    });
  },
};
