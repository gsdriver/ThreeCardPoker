// Localized resources

const seedrandom = require('seedrandom');

const common = {
  // ChangeName.js
  'CHANGE_CONFIRM': 'Welcome {Name}. |Hello {Name}. |Nice to meet you {Name}. ',
  'CHANGE_PROMPT_CHANGE': 'You can change your name at any time by saying change name. |Say change name if you want to change your player name in the future. ',
  'CHANGE_REPROMPT': 'Say play to start the game ',
  'CHANGE_REPROMPT_BUTTON': 'or press your Echo Button ',
  // EndRollCall.js
  'ENDROLLCALL_TWOBUTTONS': 'To use buttons with Three Card Poker, you need two buttons. Try playing this game again with no or two buttons.',
  // Exit.js
  'EXIT_GAME': '{Ad} Goodbye {Name}.',
  // Help.js
  'HELP_TEXT_BUY_CHIPS': 'You have {Chips}. Each win adds one chip to your total and each loss takes a chip away <break time=\"200ms\"/> Once you run out of chips, you can come back the following day for {ExtraChips} more, or buy more chips to keep playing. ',
  'HELP_TEXT': 'You have {Chips}. Each win adds one chip to your total and each loss takes a chip away <break time=\"200ms\"/> Once you run out of chips, you can come back the following day for {ExtraChips} more. ',
  'HELP_FALLBACK': 'Sorry, I didn\'t get that. <break time=\"200ms\"/> ',
  'HELP_USE_BUTTONS': 'You can press the green button to hold cards or the blue button to discard cards. ',
  'HELP_CHECK_APP': 'For full rules of play, check the Alexa companion application. ',
  'HELP_REPROMPT': 'What else can I help you with?',
  'HELP_CARD_TEXT': 'The rankings of hands from high to low are Straight Flush (three consecutive cards of the same suit - Ace can be high or low), Three of a Kind, Straight, Flush (three cards of the same suit), Pair, and High Card. If both players have the same type of hand, the ranking of cards in the hands are used to break ties.  In the event that both players have the same hand, the game ends in a tie which is awarded to the opponent.',
  'HELP_CARD_TITLE': 'Three Card Poker',
  // HighScore.js
  'LEADER_RANKING': 'Your peak balance of {Chips} chips ranks you as <say-as interpret-as="ordinal">{Position}</say-as> of {Players} players. ',
  'LEADER_NO_SCORES': 'Sorry, I\'m unable to read the current leader board. ',
  'LEADER_TOP_SCORES': 'The top {Players} players have peak chip totals of {ChipTotals}. ',
  'HIGHSCORE_REPROMPT': 'What else can I help you with?',
  // Hold.js
  'HOLD_NEXT_CARD': 'Would you like to hold the {Card}?|Want to hold the {Card}?|Want to keep the {Card}?',
  'HOLD_PREVIOUS_CARD': 'Let\'s revisit the {Card}. Want to keep it?|Back to the {Card}. Want to hold it?|Going back to the {Card}. Would you like to hold it?',
  'HOLD_DREW': 'You drew the {Card}. |You got the {Card}. |Here\'s the {Card} for you. ',
  'HOLD_PLAYER_RESULT': 'You have {Hand}. ',
  'HOLD_OPPONENT': '{Name} has {Hand} |{Name} reveals {Hand} |Looks like {Name} has {Hand} ',
  'HOLD_OPPONENT_DREW': 'and drew {Card} ',
  'HOLD_OPPONENT_HOLDALL': '<break time=\'300ms\'/> {Name} held all three cards. |<break time=\'300ms\'/> {Name} is good. ',
  'HOLD_OPPONENT_DISCARDALL': '<break time=\'300ms\'/> {Name} discarded all three cards <break time=\'300ms\'/> |<break time=\'300ms\'/> {Name} is dumping all three cards. ',
  'HOLD_OPPONENT_HELD': '<break time=\'300ms\'/> {Name} held the {Cards} <break time=\'300ms\'/> |<break time=\'300ms\'/> {Name} decided to hold the {Cards} <break time=\'300ms\'/> |<break time=\'300ms\'/> {Name} is keeping the {Cards} <break time=\'300ms\'/> ',
  'HOLD_OPPONENT_RESULT': 'making {Hand}. |for {Hand}. ',
  'HOLD_WIN': 'You win! |You\'re a winner! |Congratulations {Name} <break time=\'200ms\'/> you won! ',
  'HOLD_LOSE': 'You lost! |Sorry you lost. |Sorry {Name} <break time=\'200ms\'/> you lost. ',
  'HOLD_TIE': 'Wow, a tie! Ties go to the opponent, I\'m afraid. <amazon:effect name="whispered">It\'s only fair <break time=\'300ms\'/> they had to show you one of their cards..</amazon:effect> ',
  'HOLD_GAMEOVER_REPROMPT': 'Would you like to play again? |Go again? |Another round? |Try again? |One more time? ',
  'HOLD_BUY_CHIPS': 'Come back tomorrow for more chips. Or would you like to hear more about buying {Chips} chips to continue playing now?',
  'HOLD_NO_CHIPS': 'Come back tomorrow for more chips.',
  'HOLD_BUTTON_HELD': 'You held {Card}. |OK, let\'s hold {Card}. |Holding {Card}. ',
  'HOLD_BUTTON_DISCARD': 'You discarded {Card}. |OK, let\'s get rid of {Card}. |Discarding {Card}. ',
  // Launch.js
  'LAUNCH_WELCOME': '{Greeting} <break time=\'300ms\'/> Welcome to Three Card Poker. |{Greeting} <break time=\'300ms\'/> Let\'s play Three Card Poker. ',
  'LAUNCH_WELCOME_BACK': '{Greeting} {Name} <break time=\'300ms\'/> Welcome back to Three Card Poker. |{Greeting} {Name} <break time=\'300ms\'/> Good to have you back for Three Card Poker. |{Greeting} {Name} <break time=\'300ms\'/> Ready to play some Three Card Poker? ',
  'LAUNCH_REPROMPT': 'Please say your name to get started ',
  'LAUNCH_RETURNING_REPRONPT': 'Say play to get started ',
  'LAUNCH_BUSTED': 'You are out of chips. Come back to Three Card Poker tomorrow for {Chips} more chips. ',
  'LAUNCH_BUSTED_UPSELL': 'You are out of chips and can come back to Three Card Poker tomorrow for {Chips} more chips or would you like to hear about buying {ExtraChips} more chips to continue playing now? ',
  'LAUNCH_BUSTED_REPLENISH': 'Thanks for coming back {Name}! Here are {Chips} chips to get you back in the game. |Good to see you again {Name}! Here are {Chips} chips to keep playing. |Hey {Name}! Here are {Chips} chips to get you back in the game. ',
  'LAUNCH_REPROMPT_BUTTON': 'Or press an Echo Button to start playing. ',
  // Play.js
  'PLAY_READ_HAND': 'You have {Cards} giving you {Hand} <break time=\'300ms\'/> {OpponentName} is showing {OpponentHand}. |You have {Cards} making {Hand} <break time=\'300ms\'/> and I see {OpponentHand} in {OpponentName}\'s hand. ',
  'PLAY_REPROMPT': '<break time=\'300ms\'/> Would you like to hold {Card}?',
  'PLAY_HOLDALL_REPROMPT': '<break time=\'300ms\'/> Would you like to hold {Hand}?',
  // From Purchase.js
  'PURCHASE_MOREHANDS': 'We have a product available for purchase to give you 10 extra chips. Would you like to buy it? ',
  'PURCHASE_CONFIRM_REPROMPT': 'Say yes to buy more chips',
  'PURCHASE_NO_PURCHASE': 'What else can I help you with?',
  // Repeat.js
  'REPEAT_READ_HAND': 'You have {Cards} giving you {Hand} <break time=\'300ms\'/> |You have {Cards} making {Hand} <break time=\'300ms\'/> ',
  'REPEAT_PLAYER_HOLDING': 'You are holding {Cards} <break time=\'300ms\'/> |You chose to hold {Cards} <break time=\'300ms\'/>',
  'REPEAT_READ_OPPONENT_HAND': '{Name} has {Cards} making {Hand} <break time=\'300ms\'/> ',
  'REPEAT_UPCARD': 'I see that {Name} is showing {Card} <break time=\'300ms\'/> ',
  'REPEAT_REPROMPT': 'What else can I help you with?',
  // StartGame.js
  'STARTGAME_PRESS_DISCARD': 'Thanks {Name} <break time=\'300ms\'/> this green button will be used to hold cards <break time=\'300ms\'/> Press another button to use for discarding cards.',
  'STARTGAME_START': 'Great. This blue button will be used to discard cards. ',
  'STARTGAME_START_REPROMPT': 'Say play to get started.',
  'STARTGAME_START_REPROMPT_NONAME': 'Please say your name to get started.',
  // Suggest.js
  'SUGGEST_CARDS': 'You should hold {Cards}. |I think holding {Cards} would be good. |Maybe you should hold {Cards}. ',
  'SUGGEST_DISCARD_ALL': 'You should discard all your cards. |That hand is trash - throw all the cards away. |I think you should draw three new cards. ',
  'SUGGEST_REPROMPT': 'Say yes to follow this suggestion.|Would you like to do that?|So <break time=\'300ms\'/> what do you say, yes or no?',
  // Unhandled.js
  'UNKNOWN_INTENT': 'Sorry, I didn\'t get that. Try saying Help.',
  'UNKNOWN_INTENT_REPROMPT': 'Try saying Help.',
  // utils.js
  'GOOD_MORNING': 'Good morning ',
  'GOOD_AFTERNOON': 'Good afternoon ',
  'GOOD_EVENING': 'Good evening ',
  'GAME_TITLE': '3 Card Poker',
  'COMPUTER_NAME': 'Bob|Fred|Lori|Lynn|Sam|William|Mary|Ryan|Sandy|Tina|Diane|Norm',
  'CHIPS_LEFT': 'You have {Chips} remaining. ',
  'POKER_HAND_NOTHING_TWO': 'a two high',
  'POKER_HAND_NOTHING_THREE': 'a three high',
  'POKER_HAND_NOTHING_FOUR': 'a four high',
  'POKER_HAND_NOTHING_FIVE': 'a five high',
  'POKER_HAND_NOTHING_SIX': 'a six high',
  'POKER_HAND_NOTHING_SEVEN': 'a seven high',
  'POKER_HAND_NOTHING_EIGHT': 'an eight high',
  'POKER_HAND_NOTHING_NINE': 'a nine high',
  'POKER_HAND_NOTHING_TEN': 'a ten high',
  'POKER_HAND_NOTHING_JACK': 'a Jack high',
  'POKER_HAND_NOTHING_QUEEN': 'a Queen high',
  'POKER_HAND_NOTHING_KING': 'a King high',
  'POKER_HAND_NOTHING_ACE': 'an Ace high',
  'POKER_HAND_PAIR_TWO': 'a pair of twos',
  'POKER_HAND_PAIR_THREE': 'a pair of threes',
  'POKER_HAND_PAIR_FOUR': 'a pair of fours',
  'POKER_HAND_PAIR_FIVE': 'a pair of fives',
  'POKER_HAND_PAIR_SIX': 'a pair of sixes',
  'POKER_HAND_PAIR_SEVEN': 'a pair of sevens',
  'POKER_HAND_PAIR_EIGHT': 'a pair of eights',
  'POKER_HAND_PAIR_NINE': 'a pair of nines',
  'POKER_HAND_PAIR_TEN': 'a pair of tens',
  'POKER_HAND_PAIR_JACK': 'a pair of Jacks',
  'POKER_HAND_PAIR_QUEEN': 'a pair of Queens',
  'POKER_HAND_PAIR_KING': 'a pair of Kings',
  'POKER_HAND_PAIR_ACE': 'a pair of  Aces',
  'POKER_HAND_FLUSH': 'a flush',
  'POKER_HAND_STRAIGHT': 'a straight',
  'POKER_HAND_3OFAKIND': 'three of a kind',
  'POKER_HAND_STRAIGHTFLUSH': 'a straight flush',
  // This file
  'SAY_CARD_ACE': 'ace',
  'SAY_CARD_JACK': 'jack',
  'SAY_CARD_QUEEN': 'queen',
  'SAY_CARD_KING': 'king',
  'SAY_CARD_CLUB': 'clubs',
  'SAY_CARD_DIAMONDS': 'diamonds',
  'SAY_CARD_HEARTS': 'hearts',
  'SAY_CARD_SPADES': 'spades',
  'SAY_CARD_WITH_SUIT': '{Rank} of {Suit}',
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
