//
// Reads the top high scores
//

'use strict';

const utils = require('../utils');
const {ri} = require('@jargon/alexa-skill-sdk');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return ((request.type === 'IntentRequest') && (request.intent.name === 'HighScoreIntent'));
  },
  handle: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    return utils.readLeaderBoard(handlerInput)
    .then((highScores) => {
      let speech;
      const speechParams = {};

      if (!highScores) {
        speech = 'LEADER_NO_SCORES';
      } else {
        if (!highScores.count || !highScores.top) {
          // Something went wrong
          speech = 'LEADER_NO_SCORES';
        } else {
          speech = 'LEADER_TOP_SCORES';
          if (highScores.rank) {
            speech += '_RANKING';
            speechParams.Chips = attributes.high;
            speechParams.Position = highScores.rank;
            speechParams.Players = highScores.count;
          }

          // And what is the leader board?
          let i;
          for (i = 0; i < 5; i++) {
            speechParams['HighScore' + (i + 1)] = (highScores.top.length > i)
              ? highScores.top[i] : 0;
          }
          speechParams.NumberOfLeaders = highScores.top.length;
        }
      }

      return handlerInput.jrb
        .speak(ri(speech, speechParams))
        .reprompt(ri('HIGHSCORE_REPROMPT'))
        .getResponse();
    });
  },
};
