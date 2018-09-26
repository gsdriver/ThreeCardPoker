// Localized resources

const seedrandom = require('seedrandom');

const common = {
  // ChangeName.js
  'CHANGE_CONFIRM': 'Welcome {0}. ',
  'CHANGE_PROMPT_CHANGE': 'You can change your name at any time by saying change name. |Say change name if you want to change your player name in the future. ',
  'CHANGE_REPROMPT': 'Say play to start the game ',
  'CHANGE_REPROMPT_BUTTON': 'or press your Echo Button ',
  // Exit.js
  'EXIT_GAME': '{0} Goodbye.',
  // Help.js
  'HELP_TEXT': 'You have {0} points. Each win adds one point to your total and each loss takes a point away <break time=\"200ms\"/> Once you run out of points, you can come back the following day for {1} more, or buy more points to keep playing. For full rules of play, check the Alexa companion application. ',
  'HELP_FALLBACK': 'Sorry, I didn\'t get that. <break time=\"200ms\"/> ',
  'HELP_REPROMPT': 'What else can I help you with?',
  'HELP_CARD_TEXT': 'The rankings of hands from high to low are Straight Flush (three consecutive cards of the same suit - Ace can be high or low), Three of a Kind, Straight, Flush (three cards of the same suit), Pair, and High Card. If both players have the same type of hand, the ranking of cards in the hands are used to break ties.  In the event that both players have the same hand, the game ends in a tie which is awarded to the opponent.',
  'HELP_CARD_TITLE': 'Three Card Poker',
  // Hold.js
  'HOLD_NEXTCARD': 'Would you like to hold {0}?',
  'HOLD_DREW': 'You drew {0}. |You got {0}. |Here\'s {0} for you. ',
  'HOLD_PLAYER_RESULT': 'You have {0}. ',
  'HOLD_OPPONENT': '{1} had {0} ',
  'HOLD_OPPONENT_DREW': 'and drew {0} ',
  'HOLD_OPPONENT_HOLDALL': '<break time=\'300ms\'/> {1} held all three cards. ',
  'HOLD_OPPONENT_DISCARDALL': '<break time=\'300ms\'/> {1} discarded all three cards <break time=\'300ms\'/> ',
  'HOLD_OPPONENT_HELD': '<break time=\'300ms\'/> {1} held {0} <break time=\'300ms\'/> ',
  'HOLD_OPPONENT_RESULT': 'making {0}. |for {0}. ',
  'HOLD_WIN': 'You win! ',
  'HOLD_LOSE': 'You lose! ',
  'HOLD_TIE': 'Wow, a tie! Ties go to the opponent, I\'m afraid. ',
  'HOLD_GAMEOVER_REPROMPT': 'Would you like to play again? |Go again? |Another round? ',
  // Launch.js
  'LAUNCH_WELCOME': '{0} Welcome to Three Card Poker. ',
  'LAUNCH_WELCOME_BACK': '{0} {1} <break time=\'300ms\'/> Welcome back to Three Card Poker. ',
  'LAUNCH_REPROMPT': 'Please say your name to get started ',
  'LAUNCH_RETURNING_REPRONPT': 'Say play to get started ',
  'LAUNCH_BUSTED': 'You are out of points. Come back to Three Card Poker tomorrow for {0} more points. ',
  'LAUNCH_BUSTED_UPSELL': 'You are out of points and can come back to Three Card Poker tomorrow for {0} more points or would you like to hear about buying {1} more points to continue playing now? ',
  'LAUNCH_BUSTED_REPLENISH': 'Thanks for coming back {1}! Here are {0} points to get you back in the game. |Good to see you again {1}! Here are {0} points to keep playing. |Hey {1}! Here are {0} points to get you back in the game. ',
  'LAUNCH_REPROMPT_BUTTON': 'Or press an Echo Button to start playing. ',
  // Play.js
  'PLAY_READ_HAND': 'You have {0} giving you {3} <break time=\'300ms\'/> {1} is showing {2}. |You have {0} making {3} <break time=\'300ms\'/> and I see {2} in {1}\'s hand. ',
  'PLAY_REPRONPT': '<break time=\'300ms\'/> Would you like to hold {0}?',
  'PLAY_HOLDALL_REPROMPT': '<break time=\'300ms\'/> Would you like to hold all your cards?',
  // From Purchase.js
  'PURCHASE_MOREHANDS': 'We have a product available for purchase to give you 10 extra points. Would you like to buy it? ',
  'PURCHASE_CONFIRM_REPROMPT': 'Say yes to buy more points',
  'PURCHASE_NO_PURCHASE': 'What else can I help you with?',
  // StartGame.js
  'STARTGAME_START': 'Thanks <break time=\'300ms\'/> you can use your Echo Button to start a round or hold cards. ',
  'STARTGAME_REPROMPT': 'Please say your name to get started.',
  // Unhandled.js
  'UNKNOWN_INTENT': 'Sorry, I didn\'t get that. Try saying Bet.',
  'UNKNOWN_INTENT_REPROMPT': 'Try saying Bet.',
  // utils.js
  'GOOD_MORNING': 'Good morning <break time=\"200ms\"/> ',
  'GOOD_AFTERNOON': 'Good afternoon <break time=\"200ms\"/> ',
  'GOOD_EVENING': 'Good evening <break time=\"200ms\"/> ',
  'GAME_TITLE': '3 Card Poker',
  'COMPUTER_NAME': 'Bob|Fred|Lori|Lynn|Sam|William|Mary|Ryan|Sandy|Tina|Diane|Norm',
  'HANDS_LEFT': 'You have {0} points remaining. ',
  'HAND_NAMES': '{"nothing": "a {0} high", "pair": "a pair", "flush": "a flush", "straight": "a straight", "3ofakind": "three of a kind", "straightflush": "a straight flush"}',
  // This file
  'FORMAT_CARD': '{0} of {1}',
};

const dollar = {
};

const pound = {
};

const resources = {
  'en-US': {
    'translation': Object.assign({}, common, dollar),
  },
  'en-GB': {
    'translation': Object.assign({}, common, pound),
  },
};

const utils = (handlerInput) => {
  const locale = handlerInput.requestEnvelope.request.locale;
  let translation;
  if (resources[locale]) {
    translation = resources[locale].translation;
  } else {
    translation = resources['en-US'].translation;
  }

  return {
    getString: function(res) {
      return pickRandomOption(handlerInput, translation[res]);
    },
    readCard: function(card) {
      const ranks = {'A': 'ace', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six',
        '7': 'seven', '8': 'eight', '9': 'nine', '1': 'ten', 'J': 'jack', 'Q': 'queen', 'K': 'king'};
      const suits = {'C': 'clubs', 'D': 'diamonds', 'H': 'hearts', 'S': 'spades'};
      const suit = card.charAt(card.length - 1);
      const rank = card.charAt(card);

      return translation['FORMAT_CARD'].replace('{0}', ranks[rank]).replace('{1}', suits[suit]);
    },
    readRank: function(card) {
      const ranks = {'A': 'ace', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six',
        '7': 'seven', '8': 'eight', '9': 'nine', '1': 'ten', 'J': 'jack', 'Q': 'queen', 'K': 'king'};
      const rank = card.charAt(card);
      return ranks[rank];
    },
  };
};

module.exports = utils;

function pickRandomOption(handlerInput, res) {
  const event = handlerInput.requestEnvelope;
  const attributes = handlerInput.attributesManager.getSessionAttributes();

  const options = res.split('|');
  attributes.stringCount = (attributes.stringCount + 1) || 1;
  const seed = event.session.user.userId + attributes.stringCount;
  return options[Math.floor(seedrandom(seed)() * options.length)];
}
