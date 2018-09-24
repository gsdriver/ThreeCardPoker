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

module.exports = {
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
    const response = handlerInput.responseBuilder;
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('./resources')(handlerInput);

    if (event.context && event.context.System &&
      event.context.System.device &&
      event.context.System.device.supportedInterfaces &&
      event.context.System.device.supportedInterfaces.Display) {
      attributes.display = true;

      const image = new Alexa.ImageHelper()
        .addImageInstance('http://garrettvargas.com/img/slot-background.png')
        .getImage();
      response.addRenderTemplateDirective({
        type: 'BodyTemplate1',
        title: res.getString('GAME_TITLE'),
        backButton: 'HIDDEN',
        backgroundImage: image,
      });
    }
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
  },
  determineWinner: function(game) {
    // Get the three card hands the player and opponent are playing
    const player = mapHand(game.player);
    const opponent = mapHand(game.opponent);
    const playerDetails = poker.evaluateAndFindCards(player,
      {aceCanBeLow: true, cardsToEvaluate: 3, dontAllow: 'royalflush'});
    const opponentDetails = poker.evaluateAndFindCards(opponent,
      {aceCanBeLow: true, cardsToEvaluate: 3, dontAllow: 'royalflush'});
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
    {aceCanBeLow: true, cardsToEvaluate: 3, dontAllow: 'royalflush'});
  if (details.match === 'nothing') {
    // OK, do we have two cards to a straight or flush?
    const twocard = poker.evaluateAndFindCards(currentHand,
      {aceCanBeLow: true, cardsToEvaluate: 2, dontAllow: 'royalflush'});
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
