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
  // Hold.js
  'HOLD_NEXTCARD': 'Would you like to hold {0}?',
  'HOLD_DREW': 'You drew {0}. |You got {0}. |Here\'s {0} for you. ',
  'HOLD_OPPONENT': 'The opponent had {0} ',
  'HOLD_OPPONENT_DREW': 'and drew {0} ',
  'HOLD_OPPONENT_HOLDALL': '<break time=\'300ms\'/> They held all of their cards. ',
  'HOLD_OPPONENT_DISCARDALL': '<break time=\'300ms\'/> They discarded all of their cards <break time=\'300ms\'/> ',
  'HOLD_OPPONENT_HELD': '<break time=\'300ms\'/> They held {0} <break time=\'300ms\'/> ',
  'HOLD_WIN': 'You win! ',
  'HOLD_LOSE': 'You lose! ',
  'HOLD_TIE': 'Wow, a tie! ',
  'HOLD_GAMEOVER_REPROMPT': 'Would you like to play again? |Go again? |Another round? ',
  // Launch.js
  'LAUNCH_WELCOME': '{0} Welcome to Three Card Poker. ',
  'LAUNCH_REPROMPT': 'Please say your name to get started ',
  'LAUNCH_REPROMPT_BUTTON': 'Or press an Echo Button to start playing. ',
  // Play.js
  'PLAY_READ_HAND': 'You have {0} <break time=\'300ms\'/> {1} is showing {2}. |You have {0} <break time=\'300ms\'/> and I see {2} in {1}\'s hand. ',
  'PLAY_REPRONPT': '<break time=\'300ms\'/> Would you like to hold {0}?',
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
