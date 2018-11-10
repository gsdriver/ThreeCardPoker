//
// Utility functions
//

'use strict';

const Alexa = require('ask-sdk');
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const moment = require('moment-timezone');
const seedrandom = require('seedrandom');
const poker = require('poker-ranking');
const request = require('request-promise');
const querystring = require('querystring');
const cardRanks = require('./cardRanks');
const suggestion = require('./suggestion');
const {ri} = require('@jargon/alexa-skill-sdk');

module.exports = {
  STARTING_POINTS: 10,
  DAILY_REFRESH_POINTS: 5,
  PURCHASE_REFRESH_POINTS: 10,
  getGreeting: function(handlerInput) {
    return getUserTimezone(handlerInput)
    .then((timezone) => {
      if (timezone) {
        const hour = moment.tz(Date.now(), timezone).format('H');
        let greeting;
        if ((hour > 5) && (hour < 12)) {
          greeting = 'GOOD_MORNING';
        } else if ((hour >= 12) && (hour < 18)) {
          greeting = 'GOOD_AFTERNOON';
        } else {
          greeting = 'GOOD_EVENING';
        }

        return handlerInput.jrm.render(ri(greeting));
      } else {
        return '';
      }
    });
  },
  drawTable: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];
    const response = handlerInput.responseBuilder.getResponse();

    if ((response.directives && (response.directives[0].type === 'Dialog.Delegate'))
      || !(event.context && event.context.System &&
          event.context.System.device &&
          event.context.System.device.supportedInterfaces &&
          event.context.System.device.supportedInterfaces.Display)) {
      return Promise.resolve();
    } else {
      attributes.display = true;
      let image;
      let promise;

      // Do we have hands?
      if (!game.player || !game.opponent) {
        // Use the background image
        promise = Promise.resolve();
      } else {
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
          locale: event.request.locale,
        };

        const params = {
          url: process.env.SERVICEURL + 'threecard/drawImage',
          formData: formData,
          timeout: 3000,
        };

        promise = request.post(params);
      }

      return promise.then((body) => {
        return (body) ? JSON.parse(body).file
          : 'https://s3.amazonaws.com/garrett-alexa-images/threecard/threecardpoker-background.png';
      }).then((imageUrl) => {
        image = new Alexa.ImageHelper()
          .addImageInstance(imageUrl)
          .getImage();
        return handlerInput.jrm.render((ri('GAME_TITLE')));
      }).then((title) => {
        return handlerInput.jrb.addRenderTemplateDirective({
          type: 'BodyTemplate6',
          title: title,
          backButton: 'HIDDEN',
          backgroundImage: image,
        });
      }).catch((err) => {
        // Just fail silently
        console.log('Problem drawing table');
      });
    }
  },
  saveHand: function(handlerInput) {
    if (process.env.SERVICEURL && !process.env.NOSAVEHAND) {
      // If there isn't a name, then we need to make one up
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      const game = attributes[attributes.currentGame];
      const hand = JSON.parse(JSON.stringify(game.player));
      let promise;

      if (attributes.name) {
        promise = Promise.resolve(attributes.name);
      } else {
        promise = handlerInput.jrm.render(ri('COMPUTER_NAME'));
      }

      return promise.then((name) => {
        hand.name = name;
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
        return request.post(params);
      });
    } else {
      return Promise.resolve();
    }
  },
  readLeaderBoard: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let leaderURL = process.env.SERVICEURL + 'threecard/leaders';
    const params = {};

    params.userId = event.session.user.userId;
    params.score = attributes.high;
    const paramText = querystring.stringify(params);
    leaderURL += '?' + paramText;

    return new Promise((resolve, reject) => {
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
          resolve(leaders);
      });
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
    request.post(params).then((body) => {
    });
  },
  deal: function(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];
    const hash = userHash(handlerInput);
    const event = handlerInput.requestEnvelope;
    let promise;

    // First load an opponent hand based on other player's play!
    if (game.listOfHands && game.listOfHands.length) {
      // Pop the top hand for the opponent
      game.opponent = game.listOfHands.pop();
      promise = Promise.resolve();
    } else if (attributes.temp.computerHands) {
      // Generate a hand
      promise = generateComputerHand(handlerInput);
    } else {
      let playerURL = process.env.SERVICEURL + 'threecard/playerHand';
      if (attributes.lastToken) {
        const params = {token: attributes.lastToken};
        playerURL += '?' + querystring.stringify(params);
      }
      promise = request({uri: playerURL, method: 'GET', timeout: 1000});
    }

    return promise.then((body) => {
      if (body) {
        const playerData = JSON.parse(body);
        attributes.lastToken = playerData.token;
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
            return generateComputerHand(handlerInput);
          }
        }

        // If we don't have a token, then generate a computer hand
        if (!attributes.lastToken) {
          attributes.temp.computerHands = true;
          return generateComputerHand(handlerInput);
        }
      }
    }).then(() => {
      game.player = {
        cards: createHand(handlerInput, game.opponent.cards),
        hold: [],
      };
      game.handOver = false;
    }).catch(() => {
      // Nevermind - we're going computer mode
      console.log('Error - generating hand');
      attributes.lastToken = undefined;
      attributes.temp.computerHands = true;
      return generateComputerHand(handlerInput).then(() => {
        game.player = {
          cards: createHand(handlerInput, game.opponent.cards),
          hold: [],
        };
        game.handOver = false;
      });
    });
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
    const details = module.exports.evaluateHand(game, hand);
    const ranks = {
      '2': 'TWO', '3': 'THREE', '4': 'FOUR', '5': 'FIVE', '6': 'SIX', '7': 'SEVEN', '8': 'EIGHT',
      '9': 'NINE', '1': 'TEN', 'J': 'JACK', 'Q': 'QUEEN', 'K': 'KING', 'A': 'ACE',
    };
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

    return handlerInput.jrm.render(ri(rank));
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
  isNextDay: function(event, attributes) {
    return getUserTimezone(event)
    .then((timezone) => {
      const tz = (timezone) ? timezone : 'America/Los_Angeles';
      const busted = moment.tz(attributes.busted, tz).format('YYYY-MM-DD');
      const now = moment.tz(Date.now(), tz).format('YYYY-MM-DD');

      return (busted !== now);
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
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    return attributes.temp.playingCards[card];
  },
};

function getUserTimezone(handlerInput) {
  if (handlerInput.serviceClientFactory) {
    const event = handlerInput.requestEnvelope;
    const usc = handlerInput.serviceClientFactory.getUpsServiceClient();

    return usc.getSystemTimeZone(event.context.System.device.deviceId)
    .then((timezone) => {
      return timezone;
    })
    .catch((error) => {
      // OK if the call fails, return gracefully
      return;
    });
  } else {
    return Promise.resolve();
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
  const attributes = handlerInput.attributesManager.getSessionAttributes();
  const game = attributes[attributes.currentGame];

  return handlerInput.jrm.render('COMPUTER_NAME')
  .then((name) => {
    game.opponent = {
      name: name,
      cards: createHand(handlerInput),
    };
    game.opponent.hold = module.exports.suggestedPlay(game.opponent.cards);
    return;
  });
}

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

