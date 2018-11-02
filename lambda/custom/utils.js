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
const request = require('request');
const querystring = require('querystring');
const cardRanks = require('./cardRanks');
const suggestion = require('./suggestion');

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
  drawTable: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];
    const res = require('./resources')(handlerInput);

    return new Promise((resolve, reject) => {
      const response = handlerInput.responseBuilder.getResponse();

      if (response.directives && (response.directives[0].type === 'Dialog.Delegate')) {
        resolve();
      } else if (event.context && event.context.System &&
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

          const opponent = module.exports.mapHand(game, game.opponent);
          const playerCards = module.exports.mapHand(game, game.player).map(splitCard);

          const opponentCards = [];
          opponentCards.push(splitCard(opponent[0]));
          if (game.handOver) {
            opponentCards.push(splitCard(opponent[1]));
            opponentCards.push(splitCard(opponent[2]));
          } else {
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
          resolve();
        }
      } else {
        // Not a display device
        resolve();
      }
    });
  },
  saveHand: function(handlerInput, callback) {
    if (process.env.SERVICEURL && !process.env.NOSAVEHAND) {
      // If there isn't a name, then we need to make one up
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      const game = attributes[attributes.currentGame];
      const hand = JSON.parse(JSON.stringify(game.player));
      const res = require('./resources')(handlerInput);

      hand.name = (attributes.name) ? attributes.name : res.getString('COMPUTER_NAME');
      hand.isNamed = (attributes.name) ? true : false;
      hand.hash = userHash(handlerInput);
      hand.timestamp = Date.now();
      const formData = {
        hand: JSON.stringify(hand),
      };
      const params = {
        url: process.env.SERVICEURL + 'threecard/playerHand',
        formData: formData,
      };
      request.post(params, (err, res, body) => {
        if (err) {
          console.log(err);
        }
        callback();
      });
    } else {
      callback();
    }
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
  deal: function(handlerInput, callback) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];
    const hash = userHash(handlerInput);
    const event = handlerInput.requestEnvelope;

    // First load an opponent hand based on other player's play!
    if (game.listOfHands && game.listOfHands.length) {
      // Pop the top hand for the opponent
      game.opponent = game.listOfHands.pop();
      done();
    } else if (attributes.temp.computerHands) {
      // Generate a hand
      generateComputerHand(handlerInput);
      done();
    } else {
      let playerURL = process.env.SERVICEURL + 'threecard/playerHand';
      if (attributes.lastToken) {
        const params = {token: attributes.lastToken};
        playerURL += '?' + querystring.stringify(params);
      }
      request({
        uri: playerURL,
        method: 'GET',
        timeout: 1000,
      }, (err, response, body) => {
        if (!err) {
          const playerData = JSON.parse(body);
          if (playerData.hands && playerData.hands.length) {
            game.listOfHands = playerData.hands.filter((x) => {
              return (x.hash !== hash);
            });

            // Shuffle remaining hands using the Fisher-Yates algorithm
            let i;
            for (i = 0; i < game.listOfHands.length - 1; i++) {
              const randomValue = seedrandom(i + event.session.user.userID + (game.timestamp ? game.timestamp : ''))();
              let j = Math.floor(randomValue * (game.listOfHands.length - i));
              if (j == (game.listOfHands.length - i)) {
                j--;
              }
              j += i;
              const tempHand = game.listOfHands[i];
              game.listOfHands[i] = game.listOfHands[j];
              game.listOfHands[j] = tempHand;
            }

            if (game.listOfHands.length) {
              game.opponent = game.listOfHands.pop();
            } else {
              // We got all of our own hands - computer generate
              // and we'll get a new list next time
              generateComputerHand(handlerInput);
            }
          }
          attributes.lastToken = playerData.token;
        } else {
          // Nevermind - we're going computer mode
          attributes.lastToken = undefined;
        }

        // If we don't have a token, then generate a computer hand
        if (!attributes.lastToken) {
          attributes.temp.computerHands = true;
          generateComputerHand(handlerInput);
        }
        done();
      });
    }

    function done() {
      game.player = {
        cards: createHand(handlerInput, game.opponent.cards),
        hold: [],
      };
      game.handOver = false;
      callback();
    }
  },
  determineWinner: function(game) {
    // Get the three card hands the player and opponent are playing
    const player = module.exports.mapHand(game, game.player);
    const opponent = module.exports.mapHand(game, game.opponent);

    // Just lookup in the list of all hands
    player.sort();
    opponent.sort();
    const playerRank = cardRanks[player[0] + '-' + player[1] + '-' + player[2]];
    const opponentRank = cardRanks[opponent[0] + '-' + opponent[1] + '-' + opponent[2]];
    if (playerRank === opponentRank) {
      return 'tie';
    } else if (playerRank < opponentRank) {
      return 'player';
    } else {
      return 'opponent';
    }
  },
  evaluateHand: function(game, hand) {
    const cards = module.exports.mapHand(game, hand);
    const details = poker.evaluateAndFindCards(cards,
      {aceCanBeLow: true, cardsToEvaluate: 3, dontAllow: ['royalflush']});
    return details;
  },
  readHandRank: function(handlerInput, hand) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];
    const res = require('./resources')(handlerInput);
    const details = module.exports.evaluateHand(game, hand);
    const ranks = {
      '2': 'TWO', '3': 'THREE', '4': 'FOUR', '5': 'FIVE', '6': 'SIX', '7': 'SEVEN', '8': 'EIGHT',
      '9': 'NINE', '1': 'TEN', 'J': 'JACK', 'Q': 'QUEEN', 'K': 'KING', 'A': 'ACE',
    }
    const order = '234567891JQKA';
    let rank;

    switch (details.match) {
      case 'pair':
      // Pair of what?
        const playedHand = module.exports.mapHand(game, hand);
        let match = ranks[playedHand[0].charAt(0)];

        if (playedHand[1].charAt(0) === playedHand[2].charAt(0)) {
          match = ranks[playedHand[1].charAt(0)];
        }
        rank = 'POKER_HAND_PAIR_' + match;
        break;
      case 'flush':
        rank = 'POKER_HAND_FLUSH';
        break;
      case 'straight':
        rank = 'POKER_HAND_STRAIGHT';
        break;
      case '3ofakind':
        rank = 'POKER_HAND_3OFAKIND';
        break;
      case 'straightflush':
        rank = 'POKER_HAND_STRAIGHTFLUSH';
        break;
      default:
        // Need to replace with high card in hand
        let high = 0;

        module.exports.mapHand(game, hand).forEach((card) => {
          if (order.indexOf(card.charAt(0)) > high) {
            high = order.indexOf(card.charAt(0));
          }
        });
        rank = 'POKER_HAND_NOTHING_' + ranks[order[high]];
        break;
    }

    return res.getString(rank);
  },
  mapHand: function(game, hand) {
    let cards;
    let i;

    // If the hand isn't over, then this just returns the first three cards
    if (!game.handOver) {
      cards = hand.cards.slice(0, 3);
    } else {
      // The hand is over - first add in anything that was held
      cards = [];
      for (i = 0; i < 3; i++) {
        if (hand.hold.indexOf(i) > -1) {
          cards.push(hand.cards[i]);
        }
      }
      // Then complete the hand up to 3 cards
      const end = 6 - cards.length;
      for (i = 3; i < end; i++) {
        cards.push(hand.cards[i]);
      }
    }
    return cards;
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
  suggestedPlay: function(cards) {
    const newCards = JSON.parse(JSON.stringify(cards.slice(0, 3)));
    newCards.sort();
    const newHold = suggestion[newCards[0] + '-' + newCards[1] + '-' + newCards[2]];

    // Now we have to "unsort"
    const hold = [];
    newHold.forEach((value) => {
      hold.push(cards.indexOf(newCards[value]));
    });
    hold.sort();

    return hold;
  },
  sayCard: function(handlerInput, card) {
    const res = require('./resources')(handlerInput);
    const suits = {'C': res.getString('SAY_CARD_CLUB'),
      'D': res.getString('SAY_CARD_DIAMONDS'),
      'H': res.getString('SAY_CARD_HEARTS'),
      'S': res.getString('SAY_CARD_SPADES')};
    let rank;
    const cardSuit = card.charAt(card.length - 1);
    const cardRank = card.charAt(card);

    switch (cardRank) {
      case 'A':
        rank = res.getString('SAY_CARD_ACE');
        break;
      case 'J':
        rank = res.getString('SAY_CARD_JACK');
        break;
      case 'Q':
        rank = res.getString('SAY_CARD_QUEEN');
        break;
      case 'K':
        rank = res.getString('SAY_CARD_KING');
        break;
      case '1':
        rank = 10;
        break;
      default:
        rank = cardRank;
        break;
    }
    return res.getString('SAY_CARD_WITH_SUIT').replace('{Rank}', rank).replace('{Suit}', suits[cardSuit]);
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

function userHash(handlerInput) {
  const event = handlerInput.requestEnvelope;
  const randomValue = seedrandom(event.session.user.userId)();

  // Hash user ID so we can avoid playing against yourself
  return Math.floor(randomValue * 65536).toString(16);
}

function generateComputerHand(handlerInput) {
  const res = require('./resources')(handlerInput);
  const attributes = handlerInput.attributesManager.getSessionAttributes();
  const game = attributes[attributes.currentGame];

  game.opponent = {
    name: res.getString('COMPUTER_NAME'),
    cards: createHand(handlerInput),
  };
  game.opponent.hold = module.exports.suggestedPlay(game.opponent.cards);
}
