//
// Handles roll call for the discard button
// ending due to buttons timing out
//

'use strict';

module.exports = {
  canHandle: function(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    let timedOut = false;

    // Did we get a button timeout when the hold button was defined
    // but the discard button wasn't?
    if ((request.type === 'GameEngine.InputHandlerEvent')
      && attributes.temp.buttons && attributes.temp.buttons.hold
      && !attributes.temp.buttons.discard) {
      const gameEngineEvents = request.events || [];

      gameEngineEvents.forEach((engineEvent) => {
        // in this request type, we'll see one or more incoming events
        // corresponding to the StartInputHandler we sent above
        if (engineEvent.name === 'timeout') {
          timedOut = true;
        }
      });
    }

    return timedOut;
  },
  handle: function(handlerInput) {
    const res = require('../resources')(handlerInput);

    // Let them know we need two buttons and end the session
    return handlerInput.responseBuilder
      .speak(res.getString('ENDROLLCALL_TWOBUTTONS'))
      .withShouldEndSession(true)
      .getResponse();
  },
};
