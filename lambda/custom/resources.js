// Localized resources

const seedrandom = require('seedrandom');

const common = {
  // ChangeName.js
  'CHANGE_CONFIRM': 'Welcome {0}. |Hello {0}. |Nice to meet you {0} ',
  'CHANGE_PROMPT_CHANGE': 'You can change your name at any time by saying change name. |Say change name if you want to change your player name in the future. ',
  'CHANGE_REPROMPT': 'Say play to start the game ',
  'CHANGE_REPROMPT_BUTTON': 'or press your Echo Button ',
  // EndRollCall.js
  'ENDROLLCALL_TWOBUTTONS': 'To use buttons with Three Card Poker, you need two buttons. Try playing this game again with no or two buttons.',
  // Exit.js
  'EXIT_GAME': '{0} Goodbye {1}.',
  // Help.js
  'HELP_TEXT': 'You have {0}. Each win adds one chip to your total and each loss takes a chip away <break time=\"200ms\"/> Once you run out of chips, you can come back the following day for {1} more, or buy more chips to keep playing. For full rules of play, check the Alexa companion application. ',
  'HELP_FALLBACK': 'Sorry, I didn\'t get that. <break time=\"200ms\"/> ',
  'HELP_REPROMPT': 'What else can I help you with?',
  'HELP_CARD_TEXT': 'The rankings of hands from high to low are Straight Flush (three consecutive cards of the same suit - Ace can be high or low), Three of a Kind, Straight, Flush (three cards of the same suit), Pair, and High Card. If both players have the same type of hand, the ranking of cards in the hands are used to break ties.  In the event that both players have the same hand, the game ends in a tie which is awarded to the opponent.',
  'HELP_CARD_TITLE': 'Three Card Poker',
  // HighScore.js
  'LEADER_RANKING': 'Your peak balance of {0} chips ranks you as <say-as interpret-as="ordinal">{1}</say-as> of {2} players. ',
  'LEADER_NO_SCORES': 'Sorry, I\'m unable to read the current leader board. ',
  'LEADER_TOP_SCORES': 'The top {0} players have peak chip totals of {1}. ',
  'HIGHSCORE_REPROMPT': 'What else can I help you with?',
  // Hold.js
  'HOLD_NEXT_CARD': 'Would you like to hold the {0}?|Want to hold the {0}?|Want to keep the {0}?',
  'HOLD_PREVIOUS_CARD': 'Let\'s revisit the {0}. Want to keep it?|Back to the {0}. Want to hold it?|Going back to the {0}. Would you like to hold it?',
  'HOLD_DREW': 'You drew the {0}. |You got the {0}. |Here\'s the {0} for you. ',
  'HOLD_PLAYER_RESULT': 'You have {0}. ',
  'HOLD_OPPONENT': '{1} has {0} |{1} reveals {0} |Looks like {1} has {0} ',
  'HOLD_OPPONENT_DREW': 'and drew {0} ',
  'HOLD_OPPONENT_HOLDALL': '<break time=\'300ms\'/> {1} held all three cards. |<break time=\'300ms\'/> {1} is good. ',
  'HOLD_OPPONENT_DISCARDALL': '<break time=\'300ms\'/> {1} discarded all three cards <break time=\'300ms\'/> |<break time=\'300ms\'/> {1} is dumping all three cards. ',
  'HOLD_OPPONENT_HELD': '<break time=\'300ms\'/> {1} held the {0} <break time=\'300ms\'/> |<break time=\'300ms\'/> {1} decided to hold the {0} <break time=\'300ms\'/> |<break time=\'300ms\'/> {1} is keeping the {0} <break time=\'300ms\'/> ',
  'HOLD_OPPONENT_RESULT': 'making {0}. |for {0}. ',
  'HOLD_WIN': 'You win! |You\'re a winner! |Congratulations {0} <break time=\'200ms\'/> you won! ',
  'HOLD_LOSE': 'You lost! |Sorry you lost. |Sorry {0} <break time=\'200ms\'/> you lost. ',
  'HOLD_TIE': 'Wow, a tie! Ties go to the opponent, I\'m afraid. <amazon:effect name="whispered">It\'s only fair <break time=\'300ms\'/> they had to show you one of their cards..</amazon:effect> ',
  'HOLD_GAMEOVER_REPROMPT': 'Would you like to play again? |Go again? |Another round? |Try again? |One more time? ',
  'HOLD_BUY_CHIPS': 'Come back tomorrow for more chips. Or would you like to hear more about buying {0} chips to continue playing now?',
  'HOLD_NO_CHIPS': 'Come back tomorrow for more chips.',
  // Launch.js
  'LAUNCH_WELCOME': '{0} <break time=\'300ms\'/> Welcome to Three Card Poker. |{0} <break time=\'300ms\'/> Let\'s play Three Card Poker. ',
  'LAUNCH_WELCOME_BACK': '{0} {1} <break time=\'300ms\'/> Welcome back to Three Card Poker. |{0} {1} <break time=\'300ms\'/> Good to have you back for Three Card Poker. |{0} {1} <break time=\'300ms\'/> Ready to play some Three Card Poker? ',
  'LAUNCH_REPROMPT': 'Please say your name to get started ',
  'LAUNCH_RETURNING_REPRONPT': 'Say play to get started ',
  'LAUNCH_BUSTED': 'You are out of chips. Come back to Three Card Poker tomorrow for {0} more chips. ',
  'LAUNCH_BUSTED_UPSELL': 'You are out of chips and can come back to Three Card Poker tomorrow for {0} more chips or would you like to hear about buying {1} more chips to continue playing now? ',
  'LAUNCH_BUSTED_REPLENISH': 'Thanks for coming back {1}! Here are {0} chips to get you back in the game. |Good to see you again {1}! Here are {0} chips to keep playing. |Hey {1}! Here are {0} chips to get you back in the game. ',
  'LAUNCH_REPROMPT_BUTTON': 'Or press an Echo Button to start playing. ',
  // Play.js
  'PLAY_READ_HAND': 'You have {0} giving you {3} <break time=\'300ms\'/> {1} is showing {2}. |You have {0} making {3} <break time=\'300ms\'/> and I see {2} in {1}\'s hand. ',
  'PLAY_REPRONPT': '<break time=\'300ms\'/> Would you like to hold {0}?',
  'PLAY_HOLDALL_REPROMPT': '<break time=\'300ms\'/> Would you like to hold {0}?',
  // From Purchase.js
  'PURCHASE_MOREHANDS': 'We have a product available for purchase to give you 10 extra chips. Would you like to buy it? ',
  'PURCHASE_CONFIRM_REPROMPT': 'Say yes to buy more chips',
  'PURCHASE_NO_PURCHASE': 'What else can I help you with?',
  // Repeat.js
  'REPEAT_READ_HAND': 'You have {0} giving you {1} <break time=\'300ms\'/> |You have {0} making {1} <break time=\'300ms\'/> ',
  'REPEAT_PLAYER_HOLDING': 'You are holding {0} <break time=\'300ms\'/> |You chose to hold {0} <break time=\'300ms\'/>',
  'REPEAT_READ_OPPONENT_HAND': '{0} has {1} making {2} <break time=\'300ms\'/> ',
  'REPEAT_UPCARD': 'I see that {0} is showing {1} <break time=\'300ms\'/> ',
  // StartGame.js
  'STARTGAME_PRESS_DISCARD': 'Thanks {0} <break time=\'300ms\'/> this green button will be used to hold cards <break time=\'300ms\'/> Press another button to use for discarding cards.',
  'STARTGAME_START': 'Great. This button will be used to discard cards. ',
  'STARTGAME_START_REPROMPT': 'Say play to get started.',
  'STARTGAME_START_REPROMPT_NONAME': 'Please say your name to get started.',
  // Unhandled.js
  'UNKNOWN_INTENT': 'Sorry, I didn\'t get that. Try saying Help.',
  'UNKNOWN_INTENT_REPROMPT': 'Try saying Help.',
  // utils.js
  'GOOD_MORNING': 'Good morning ',
  'GOOD_AFTERNOON': 'Good afternoon ',
  'GOOD_EVENING': 'Good evening ',
  'GAME_TITLE': '3 Card Poker',
  'COMPUTER_NAME': 'Bob|Fred|Lori|Lynn|Sam|William|Mary|Ryan|Sandy|Tina|Diane|Norm',
  'CHIPS_LEFT': 'You have {0} remaining. ',
  'HAND_NAMES': '{"nothing": "a {0} high", "pair": "a pair", "flush": "a flush", "straight": "a straight", "3ofakind": "three of a kind", "straightflush": "a straight flush"}',
  // This file
  'FORMAT_CARD': '{0} of {1}',
};

const resources = {
  'en-US': {
    'translation': Object.assign({}, common),
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
    sayChips: function(chips) {
      if (chips === 0) {
        return 'no chips';
      } else if (chips === 1) {
        return '1 chip';
      } else {
        return (chips + ' chips');
      }
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
