//
// Utility functions
//

'use strict';

const Alexa = require('ask-sdk');
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const https = require('https');
const moment = require('moment-timezone');
const seedrandom = require('seedrandom');
const poker = require('poker-ranking');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const request = require('request');
const querystring = require('querystring');

module.exports = {
  STARTING_POINTS: 10,
  DAILY_REFRESH_POINTS: 5,
  PURCHASE_REFRESH_POINTS: 10,
  getGreeting: function(handlerInput, callback) {
    const event = handlerInput.requestEnvelope;
    const res = require('./resources')(handlerInput);

    getUserTimezone(event, (timezone) => {
      if (timezone) {
        const hour = moment.tz(Date.now(), timezone).format('H');
        let greeting;
        if ((hour > 5) && (hour < 12)) {
          greeting = res.getString('GOOD_MORNING');
        } else if ((hour >= 12) && (hour < 18)) {
          greeting = res.getString('GOOD_AFTERNOON');
        } else {
          greeting = res.getString('GOOD_EVENING');
        }
        callback(greeting);
      } else {
        callback('');
      }
    });
  },
  drawTable: function(handlerInput, callback) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];
    const res = require('./resources')(handlerInput);

    if (event.context && event.context.System &&
      event.context.System.device &&
      event.context.System.device.supportedInterfaces &&
      event.context.System.device.supportedInterfaces.Display) {
      attributes.display = true;
      let imageUrl;

      // Do we have hands?
      if (!game.player || !game.opponent) {
        // Use the background image
        imageUrl = 'https://s3.amazonaws.com/garrett-alexa-images/threecard/threecardpoker-background.png';
        done();
      } else {
        const start = Date.now();
        let end;

        function splitCard(card) {
          const result = {};
          const rank = card.charAt(0);
          const faceCards = '1JQKA';

          if (faceCards.indexOf(rank) > -1) {
            result.rank = 10 + faceCards.indexOf(rank);
          } else {
            result.rank = rank;
          }
          result.suit = card.charAt(card.length - 1);
          return result;
        }

        let playerCards;
        const opponent = mapHand(game.opponent);
        const opponentCards = [];
        opponentCards.push(splitCard(opponent[0]));
        if (game.showOpponent) {
          playerCards = mapHand(game.player).map(splitCard);
          opponentCards.push(splitCard(opponent[1]));
          opponentCards.push(splitCard(opponent[2]));
        } else {
          playerCards = game.player.cards.slice(0, 3).map(splitCard);
          opponentCards.push({rank: '1', suit: 'N'});
          opponentCards.push({rank: '1', suit: 'N'});
        }
        const formData = {
          player: JSON.stringify(playerCards),
          opponent: JSON.stringify(opponentCards),
        };

        const params = {
          url: process.env.SERVICEURL + 'threecard/drawImage',
          formData: formData,
          timeout: 3000,
        };

        request.post(params, (err, res, body) => {
          if (err) {
            console.log(err);
            imageUrl = 'https://s3.amazonaws.com/garrett-alexa-images/threecard/threecardpoker-background.png';
          } else {
            imageUrl = JSON.parse(body).file;
            end = Date.now();
          }
          console.log('Drawing table took ' + (end - start) + ' ms');
          done();
        });
      }

      function done() {
        const image = new Alexa.ImageHelper()
          .addImageInstance(imageUrl)
          .getImage();
        handlerInput.responseBuilder.addRenderTemplateDirective({
          type: 'BodyTemplate6',
          title: res.getString('GAME_TITLE'),
          backButton: 'HIDDEN',
          backgroundImage: image,
        });
        callback();
      }
    } else {
      // Not a display device
      callback();
    }
  },
  saveHand: function(handlerInput, callback) {
    // If there isn't a name, then we need to make one up
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];
    const hand = JSON.parse(JSON.stringify(game.player));
    const res = require('./resources')(handlerInput);

    hand.name = (attributes.name) ? attributes.name : res.getString('COMPUTER_NAME');
    hand.hash = userHash(handlerInput);
    const params = {Body: JSON.stringify(hand),
      Bucket: 'threecardpokerhands',
      Key: 'raw/' + Date.now() + '.txt'};
    s3.putObject(params, (err, data) => {
      if (err) {
        console.log('Error writing to S3 ' + err.stack);
      }
      callback();
    });
  },
  readLeaderBoard: function(handlerInput, callback) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let leaderURL = process.env.SERVICEURL + 'threecard/leaders';
    const params = {};

    params.userId = event.session.user.userId;
    params.score = attributes.high;
    const paramText = querystring.stringify(params);
    leaderURL += '?' + paramText;

    request(
      {
        uri: leaderURL,
        method: 'GET',
        timeout: 1000,
      }, (err, response, body) => {
        let leaders;

        if (!err) {
          leaders = JSON.parse(body);
        }
        callback(err, leaders);
    });
  },
  updateLeaderBoard: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();

    // Update the leader board
    const formData = {
      userId: event.session.user.userId,
      attributes: JSON.stringify(attributes),
    };
    const params = {
      url: process.env.SERVICEURL + 'threecard/updateLeaderBoard',
      formData: formData,
    };
    request.post(params, (err, res, body) => {
      if (err) {
        console.log(err);
      }
    });
  },
  deal: function(handlerInput) {
    // First get a player hand
    // For now, we're going to just computer generate it
    const res = require('./resources')(handlerInput);
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];
    game.opponent = {
      name: res.getString('COMPUTER_NAME'),
      cards: createHand(handlerInput),
    };
    game.opponent.hold = playHand(game.opponent.cards);
    game.player = {
      cards: createHand(handlerInput, game.opponent.cards),
      hold: [],
    };
    game.showOpponent = false;
  },
  determineWinner: function(game) {
    // Get the three card hands the player and opponent are playing
    const player = mapHand(game.player);
    const opponent = mapHand(game.opponent);
    const playerDetails = poker.evaluateAndFindCards(player,
      {aceCanBeLow: true, cardsToEvaluate: 3, dontAllow: ['royalflush']});
    const opponentDetails = poker.evaluateAndFindCards(opponent,
      {aceCanBeLow: true, cardsToEvaluate: 3, dontAllow: ['royalflush']});
    const order = ['nothing', 'pair', 'flush', 'straight', '3ofakind', 'straightflush'];

    if (playerDetails.match !== opponentDetails.match) {
      return (order.indexOf(playerDetails.match) > order.indexOf(opponentDetails.match)) ? 'player' : 'opponent';
    } else {
      const playerSorted = sortHand(player, playerDetails);
      const opponentSorted = sortHand(opponent, opponentDetails);
      let i;

      for (i = 0; i < playerSorted.length; i++) {
        if (getRank(playerSorted[i]) > getRank(opponentSorted[i])) {
          return 'player';
        } else if (getRank(opponentSorted[i]) > getRank(playerSorted[i])) {
          return 'opponent';
        }
      }

      // Wow!  A tie?!
      return 'tie';
    }
  },
  evaluateHand: function(hand) {
    const cards = mapHand(hand);
    const details = poker.evaluateAndFindCards(cards,
      {aceCanBeLow: true, cardsToEvaluate: 3, dontAllow: ['royalflush']});
    return details;
  },
  readHandRank: function(handlerInput, hand) {
    const res = require('./resources')(handlerInput);
    const details = module.exports.evaluateHand(hand);
    let rank = JSON.parse(res.getString('HAND_NAMES'))[details.match];

    if (rank.includes('{0}')) {
      // Need to replace with high card in hand
      const sorted = sortHand(mapHand(hand), details);
      rank = rank.replace('{0}', res.readRank(sorted[0]));
    }

    return rank;
  },
  isNextDay: function(event, attributes, callback) {
    getUserTimezone(event, (timezone) => {
      const tz = (timezone) ? timezone : 'America/Los_Angeles';
      const busted = moment.tz(attributes.busted, tz).format('YYYY-MM-DD');
      const now = moment.tz(Date.now(), tz).format('YYYY-MM-DD');

      callback(busted !== now);
    });
  },
  getPurchaseDirective: function(attributes, action, message) {
    return {
      'type': 'Connections.SendRequest',
      'name': action,
      'payload': {
        'InSkillProduct': {
          'productId': attributes.paid.morehands.productId,
        },
        'upsellMessage': message,
      },
      'token': action,
    };
  },
  getPurchasedProducts: function(event, attributes, callback) {
    // Invoke the entitlement API to load products
    const options = {
      host: 'api.amazonalexa.com',
      path: '/v1/users/~current/skills/~current/inSkillProducts',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': event.request.locale,
        'Authorization': 'bearer ' + event.context.System.apiAccessToken,
      },
    };
    const req = https.get(options, (res) => {
      let returnData = '';
      res.setEncoding('utf8');
      if (res.statusCode != 200) {
        console.log('inSkillProducts returned status code ' + res.statusCode);
        callback(res.statusCode);
      } else {
        res.on('data', (chunk) => {
          returnData += chunk;
        });

        res.on('end', () => {
          const inSkillProductInfo = JSON.parse(returnData);
          if (Array.isArray(inSkillProductInfo.inSkillProducts)) {
            // Let's see what they paid for
            if (!attributes.paid) {
              attributes.paid = {};
            }
            inSkillProductInfo.inSkillProducts.forEach((product) => {
              attributes.paid[product.referenceName] = {
                productId: product.productId,
                state: (product.entitled == 'ENTITLED') ? 'PURCHASED' : 'AVAILABLE',
              };
            });
          }
          callback();
        });
      }
    });

    req.on('error', (err) => {
      console.log('Error calling inSkillProducts API: ' + err.message);
      callback(err);
    });
  },
};

function getUserTimezone(event, callback) {
  if (event.context.System.apiAccessToken) {
    // Invoke the entitlement API to load timezone
    const options = {
      host: 'api.amazonalexa.com',
      path: '/v2/devices/' + event.context.System.device.deviceId + '/settings/System.timeZone',
      method: 'GET',
      timeout: 1000,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': event.request.locale,
        'Authorization': 'bearer ' + event.context.System.apiAccessToken,
      },
    };

    const req = https.get(options, (res) => {
      let returnData = '';
      res.setEncoding('utf8');
      if (res.statusCode != 200) {
        console.log('deviceTimezone returned status code ' + res.statusCode);
        callback();
      } else {
        res.on('data', (chunk) => {
          returnData += chunk;
        });

        res.on('end', () => {
          // Strip quotes
          const timezone = returnData.replace(/['"]+/g, '');
          callback(moment.tz.zone(timezone) ? timezone : undefined);
        });
      }
    });

    req.on('error', (err) => {
      console.log('Error calling user settings API: ' + err.message);
      callback();
    });
  } else {
    // No API token - no user timezone
    callback();
  }
}

function createHand(handlerInput, excludeCards) {
  // For now, we'll create it ourselves
  let i;
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const suits = ['C', 'D', 'H', 'S'];
  const deck = [];
  const attributes = handlerInput.attributesManager.getSessionAttributes();
  const game = attributes[attributes.currentGame];
  const event = handlerInput.requestEnvelope;

  // If cards is given, we want to exclude these from the deck
  ranks.map((rank) => {
    suits.map((suit) => {
      const card = rank + suit;
      if (!excludeCards || (excludeCards.indexOf(card) === -1)) {
        deck.push(card);
      }
    });
  });

  // Shuffle using the Fisher-Yates algorithm
  for (i = 0; i < deck.length - 1; i++) {
    const randomValue = seedrandom(i + event.session.user.userId + (game.timestamp ? game.timestamp : ''))();
    let j = Math.floor(randomValue * (deck.length - i));
    if (j == (deck.length - i)) {
      j--;
    }
    j += i;
    const tempCard = deck[i];
    deck[i] = deck[j];
    deck[j] = tempCard;
  }

  // And return the first six cards from this deck
  return deck.slice(0, 6);
}

function playHand(cards) {
  let hold;

  // Our strategy - if we have anything, we'll draw
  // We keep two cards to a straight or flush
  // We keep highest card if Jack or higher
  // Otherwise, through them all in

  // Look at the first three cards, and figure out what you want to hold
  const currentHand = cards.slice(0, 3);
  const details = poker.evaluateAndFindCards(currentHand,
    {aceCanBeLow: true, cardsToEvaluate: 3, dontAllow: ['royalflush']});
  if (details.match === 'nothing') {
    // OK, do we have two cards to a straight or flush?
    const twocard = poker.evaluateAndFindCards(currentHand,
      {aceCanBeLow: true, cardsToEvaluate: 2, dontAllow: ['royalflush']});
    if ((twocard.match === 'flush') || (twocard.match === 'straight')) {
      hold = [cards.indexOf(twocard.cards[0]), cards.indexOf(twocard.cards[1])];
    } else {
      // If there is a face card hold the highest
      const faces = cards[0].charAt(0) + cards[1].charAt(0) + cards[2].charAt(0);
      if (faces.indexOf('A') > -1) {
        hold = [faces.indexOf('A')];
      } else if (faces.indexOf('K') > -1) {
        hold = [faces.indexOf('K')];
      } else if (faces.indexOf('Q') > -1) {
        hold = [faces.indexOf('Q')];
      } else if (faces.indexOf('J') > -1) {
        hold = [faces.indexOf('J')];
      } else {
        // Throw all cards in
        hold = [];
      }
    }
  } else if (details.match === 'pair') {
    // We're going to hold the pair and try for one more card
    hold = [cards.indexOf(details.cards[0]), cards.indexOf(details.cards[1])];
  } else {
    // Better than pair means hold all
    hold = [0, 1, 2];
  }

  return hold;
}

function mapHand(hand) {
  const cards = [];
  let i;

  // First three cards -- see what is held
  for (i = 0; i < 3; i++) {
    if (hand.hold.indexOf(i) > -1) {
      cards.push(hand.cards[i]);
    }
  }
  for (i = 3; i < hand.cards.length; i++) {
    if (cards.length < 3) {
      cards.push(hand.cards[i]);
    }
  }
  return cards;
}

function sortHand(cards, details) {
  const sorted = [];
  const nonMatched = [];

  // Same hand - so look at order of cards within the hands
  details.cards.sort((a, b) => (getRank(b) - getRank(a)));
  details.cards.forEach((card) => {
    sorted.push(card);
  });
  cards.forEach((card) => {
    if (sorted.indexOf(card) === -1) {
      nonMatched.push(card);
    }
  });

  // OK, now sort the nonmatched cards and insert
  nonMatched.sort((a, b) => (getRank(b) - getRank(a)));
  nonMatched.forEach((card) => {
    sorted.push(card);
  });
  return sorted;
}

function getRank(card) {
  // Ranksing of cards
  const cardRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '1', 'J', 'Q', 'K', 'A'];

  return cardRanks.indexOf(card.charAt(0));
}

function userHash(handlerInput) {
  const event = handlerInput.requestEnvelope;
  const randomValue = seedrandom(event.session.user.userId)();

  // Hash user ID so we can avoid playing against yourself
  return Math.floor(randomValue * 65536).toString(16);
}
