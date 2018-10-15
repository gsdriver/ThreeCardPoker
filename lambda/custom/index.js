'use strict';

const Alexa = require('ask-sdk');
const CanFulfill = require('./intents/CanFulfill');
const Launch = require('./intents/Launch');
const SessionEnd = require('./intents/SessionEnd');
const Unhandled = require('./intents/Unhandled');
const StartGame = require('./intents/StartGame');
const EndRollCall = require('./intents/EndRollCall');
const ChangeName = require('./intents/ChangeName');
const Purchase = require('./intents/Purchase');
const Refund = require('./intents/Refund');
const ProductResponse = require('./intents/ProductResponse');
const Suggest = require('./intents/Suggest');
const Help = require('./intents/Help');
const HighScore = require('./intents/HighScore');
const Play = require('./intents/Play');
const Repeat = require('./intents/Repeat');
const Exit = require('./intents/Exit');
const Hold = require('./intents/Hold');
const utils = require('./utils');
const buttons = require('./buttons');

const requestInterceptor = {
  process(handlerInput) {
    return new Promise((resolve, reject) => {
      const attributesManager = handlerInput.attributesManager;
      const sessionAttributes = attributesManager.getSessionAttributes();
      const event = handlerInput.requestEnvelope;

      if (Object.keys(sessionAttributes).length === 0) {
        // No session attributes - so get the persistent ones
        attributesManager.getPersistentAttributes()
          .then((attributes) => {
            // If no persistent attributes, it's a new player
            attributes.temp = {};
            attributes.temp.newSession = true;
            attributes.sessions = (attributes.sessions + 1) || 1;
            attributes.playerLocale = event.request.locale;

            if (!attributes.currentGame) {
              attributes.currentGame = 'standard';
              attributes.points = utils.STARTING_POINTS;
              attributes.high = utils.STARTING_POINTS;
              attributes.prompts = {};
              attributes.standard = {
              };
            }

            // Now get the product ID of any purchasable products
            utils.getPurchasedProducts(event, attributes, () => {
              // Since there were no session attributes, this is the first
              // round of the session - set the temp attributes
              attributesManager.setSessionAttributes(attributes);
              resolve();
            });
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        resolve();
      }
    });
  },
};

const saveResponseInterceptor = {
  process(handlerInput) {
    return new Promise((resolve, reject) => {
      const response = handlerInput.responseBuilder.getResponse();
      const attributes = handlerInput.attributesManager.getSessionAttributes();

      if (response) {
        if (!response.shouldEndSession && attributes.temp && attributes.temp.newSession) {
          // Set up the buttons to all flash, welcoming the user to press a button
          buttons.addLaunchAnimation(handlerInput);
          buttons.buildButtonDownAnimationDirective(handlerInput, []);
          buttons.startInputHandler(handlerInput);
          attributes.temp.newSession = undefined;
        }
        utils.drawTable(handlerInput).then(() => {
          if (response.shouldEndSession) {
            // We are meant to end the session
            SessionEnd.handle(handlerInput);
          } else if (attributes.temp) {
            // Save the response and reprompt for repeat
            if (response.outputSpeech && response.outputSpeech.ssml) {
              attributes.temp.lastResponse = response.outputSpeech.ssml;
            }
            if (response.reprompt && response.reprompt.outputSpeech
              && response.reprompt.outputSpeech.ssml) {
              attributes.temp.lastReprompt = response.reprompt.outputSpeech.ssml;
            }
          }
          if (!process.env.NOLOG) {
            console.log(JSON.stringify(response));
          }
          resolve();
        });
      }
    });
  },
};

const ErrorHandler = {
  canHandle(handlerInput, error) {
    return error.name.startsWith('AskSdk');
  },
  handle(handlerInput, error) {
    console.log(error.stack);
    return handlerInput.responseBuilder
      .speak('An error was encountered while handling your request. Try again later')
      .getResponse();
  },
};

if (process.env.DASHBOTKEY) {
  const dashbot = require('dashbot')(process.env.DASHBOTKEY).alexa;
  exports.handler = dashbot.handler(runGame);
} else {
  exports.handler = runGame;
}

function runGame(event, context, callback) {
  const skillBuilder = Alexa.SkillBuilders.standard();

  if (!process.env.NOLOG) {
    console.log(JSON.stringify(event));
  }

  // If this is a CanFulfill, handle this separately
  if (event.request && (event.request.type == 'CanFulfillIntentRequest')) {
    callback(null, CanFulfill.check(event));
    return;
  }

  const skillFunction = skillBuilder.addRequestHandlers(
      ProductResponse,
      Launch,
      StartGame,
      EndRollCall,
      ChangeName,
      Purchase,
      Refund,
      Play,
      Suggest,
      Hold,
      Help,
      HighScore,
      Repeat,
      Exit,
      SessionEnd,
      Unhandled
    )
    .addErrorHandlers(ErrorHandler)
    .addRequestInterceptors(requestInterceptor)
    .addResponseInterceptors(saveResponseInterceptor)
    .withTableName('ThreeCardPoker')
    .withAutoCreateTable(true)
    .withSkillId('amzn1.ask.skill.115099ae-4d44-4d1c-aa99-634f34acf802')
    .lambda();
  skillFunction(event, context, (err, response) => {
    callback(err, response);
  });
}
