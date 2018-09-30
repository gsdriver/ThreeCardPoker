//
// Checks whether we can fulfill this intent
// Note that this is processed outside of the normal Alexa SDK
// So we cannot use ask-sdk functionality here
//

'use strict';

module.exports = {
  check: function(event) {
    // We ignore the intent when the user launches the skill
    // so we can fulfill pretty much anything
    const universalIntents = ['AMAZON.FallbackIntent', 'AMAZON.RepeatIntent',
      'AMAZON.HelpIntent', 'AMAZON.YesIntent', 'AMAZON.NoIntent', 'AMAZON.StopIntent',
      'AMAZON.CancelIntent', 'AMAZON.NextIntent', 'AMAZON.PreviousIntent',
      'HighScoreIntent', 'PlayIntent'];
    const usIntents = ['PurchaseIntent', 'RefundIntent'];
    let verified;

    // Default to a negative response
    const response = {
      'version': '1.0',
      'response': {
        'canFulfillIntent': {
          'canFulfill': 'NO',
          'slots': {},
        },
      },
    };

    if (universalIntents.indexOf(event.request.intent.name) > -1) {
      verified = true;
    } else if ((event.request.locale === 'en-US')
      && (usIntents.indexOf(event.request.intent.name) > -1)) {
      verified = true;
    } else if (event.request.intent.name === 'ChangeNameIntent') {
      // Name slot is required
      verified = (event.request.intent.slots && event.request.intent.slots.Name
        && event.request.intent.slots.Name.value);
    }

    if (verified) {
      // We can fulfill it - all slots are good
      let slot;

      response.response.canFulfillIntent.canFulfill = 'YES';
      for (slot in event.request.intent.slots) {
        if (slot) {
          response.response.canFulfillIntent.slots[slot] =
            {'canUnderstand': 'YES', 'canFulfill': 'YES'};
        }
      }
    }

    return response;
  },
};
