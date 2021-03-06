//
// Handles response from Product purchase, upsell, or refund
//

'use strict';

const Launch = require('./Launch');
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const SNS = new AWS.SNS();
const utils = require('../utils');

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (request.type === 'Connections.Response');
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    return new Promise((resolve, reject) => {
      // Publish to SNS so we know something happened
      if (process.env.SNSTOPIC) {
        const start = Date.now();
        SNS.publish({
          Message: event.request.name + ' was ' + event.request.payload.purchaseResult
            + ' by user ' + event.session.user.userId,
          TopicArn: process.env.SNSTOPIC,
          Subject: 'Three Card Poker Purchase Response',
        }, (err, data) => {
          if (err) {
            console.log(err);
          }
          console.log('SNS post took ' + (Date.now() - start) + ' ms');
          done();
        });
      } else {
        done();
      }

      function done() {
        const accepted = (event.request.payload &&
            ((event.request.payload.purchaseResult == 'ACCEPTED') ||
             (event.request.payload.purchaseResult == 'ALREADY_PURCHASED')));

        if (accepted) {
          // If they accepted a purchase (or upsell) then add to the bankroll
          if ((event.request.name === 'Upsell') || (event.request.name === 'Buy')) {
            attributes.points += utils.PURCHASE_REFRESH_POINTS;
            attributes.busted = undefined;
          } else if (event.request.name === 'Cancel') {
            // If they accepted a cancel so nuke their remaining hands
            // We also don't want to upsell since they just cancelled
            attributes.points = 0;
            attributes.busted = Date.now();
            attributes.temp.noUpsell = true;
          }
        } else if (event.request.name === 'Upsell') {
          // Set the no upsell flag so they avoid an infinite loop
          attributes.temp.noUpsell = true;
        }

        // We will drop them directly into a game
        Launch.handle(handlerInput)
        .then((response) => {
          resolve(response);
        });
      }
    });
  },
};
