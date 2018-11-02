//
// Reads the top high scores
//

'use strict';

const utils = require('../utils');
const speechUtils = require('alexa-speech-utils')();

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest') && (request.intent.name === 'HighScoreIntent'));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../resources')(handlerInput);

    return new Promise((resolve, reject) => {
      utils.readLeaderBoard(handlerInput, (err, highScores) => {
        let speech = '';
        const reprompt = res.getString('HIGHSCORE_REPROMPT');

        if (!highScores) {
          speech = res.getString('LEADER_NO_SCORES');
        } else {
          if (!highScores.count || !highScores.top) {
            // Something went wrong
            speech = res.getString('LEADER_NO_SCORES');
          } else {
            if (highScores.rank) {
              speech += res.getString('LEADER_RANKING')
                 .replace('{Chips}', attributes.high)
                 .replace('{Position}', highScores.rank)
                 .replace('{Players}', highScores.count);
            }

            // And what is the leader board?
            const topScores = highScores.top.map((x) => res.sayChips(x));
            speech += res.getString('LEADER_TOP_SCORES')
                .replace('{Players}', topScores.length)
                .replace('{ChipTotals}', speechUtils.and(topScores, {locale: event.request.locale, pause: '300ms'}));
          }
        }

        speech += reprompt;
        const response = handlerInput.responseBuilder
          .speak(speech)
          .reprompt(reprompt)
          .getResponse();
        resolve(response);
      });
    });
  },
};
