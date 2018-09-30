//
// Echo Button support functions
//

'use strict';

module.exports = {
  supportButtons: function(handlerInput) {
    const localeList = ['en-US', 'en-GB', 'de-DE'];
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const locale = handlerInput.requestEnvelope.request.locale;

    return (!process.env.NOBUTTONS &&
      (localeList.indexOf(locale) >= 0) &&
      (attributes.platform !== 'google') && !attributes.bot);
  },
  getPressedButton: function(request, attributes) {
    const gameEngineEvents = request.events || [];
    let buttonId;

    gameEngineEvents.forEach((engineEvent) => {
      // in this request type, we'll see one or more incoming events
      // corresponding to the StartInputHandler we sent above
      if (engineEvent.name === 'timeout') {
        console.log('Timed out waiting for button');
      } else if (engineEvent.name === 'button_down_event') {
        // save id of the button that triggered event
        console.log('Received button down request');
        buttonId = engineEvent.inputEvents[0].gadgetId;
      }
    });

    return buttonId;
  },
  startInputHandler: function(handlerInput) {
    if (module.exports.supportButtons(handlerInput)) {
      // We'll allow them to press the button again if we haven't already
      const inputDirective = {
        'type': 'GameEngine.StartInputHandler',
        'timeout': 40000,
        'recognizers': {
          'button_down_recognizer': {
            'type': 'match',
            'fuzzy': false,
            'anchor': 'end',
            'pattern': [{
              'action': 'down',
            }],
          },
        },
        'events': {
          'button_down_event': {
            'meets': ['button_down_recognizer'],
            'reports': 'matches',
            'shouldEndInputHandler': false,
          },
        },
      };
      handlerInput.responseBuilder.addDirective(inputDirective);
    }
  },
  secondButtonInputHandler: function(handlerInput) {
    if (module.exports.supportButtons(handlerInput)) {
      // 15 seconds to press the second button - and we'd like a timeout
      const inputDirective = {
        'type': 'GameEngine.StartInputHandler',
        'timeout': 15000,
        'recognizers': {
          'button_down_recognizer': {
            'type': 'match',
            'fuzzy': false,
            'anchor': 'end',
            'pattern': [{
              'action': 'down',
            }],
          },
        },
        'events': {
          'button_down_event': {
            'meets': ['button_down_recognizer'],
            'reports': 'matches',
            'shouldEndInputHandler': false,
          },
          'timeout': {
            'meets': ['timed out'],
            'reports': 'history',
            'shouldEndInputHandler': true,
          },
        },
      };
      handlerInput.responseBuilder.addDirective(inputDirective);
    }
  },
  playInputHandler: function(handlerInput) {
    if (module.exports.supportButtons(handlerInput)) {
      // Need both hold and discard buttons
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      if (attributes.temp.buttons && attributes.temp.buttons.hold
        && attributes.temp.buttons.discard) {
        // We'll allow them to press the button again if we haven't already
        const inputDirective = {
          'type': 'GameEngine.StartInputHandler',
          'timeout': 90000,
          'recognizers': {
            'button_down_recognizer': {
              'type': 'match',
              'fuzzy': false,
              'gadgetIds': [attributes.temp.buttons.hold, attributes.temp.buttons.discard],
              'anchor': 'end',
              'pattern': [{
                'action': 'down',
              }],
            },
          },
          'events': {
            'button_down_event': {
              'meets': ['button_down_recognizer'],
              'reports': 'matches',
              'shouldEndInputHandler': false,
            },
          },
        };
        handlerInput.responseBuilder.addDirective(inputDirective);
      }
    }
  },
  buildButtonDownAnimationDirective: function(handlerInput, targetGadgets) {
    if (module.exports.supportButtons(handlerInput)) {
      const buttonDownDirective = {
        'type': 'GadgetController.SetLight',
        'version': 1,
        'targetGadgets': targetGadgets,
        'parameters': {
          'animations': [{
            'repeat': 1,
            'targetLights': ['1'],
            'sequence': [{
              'durationMs': 500,
              'color': 'FFFFFF',
              'intensity': 255,
              'blend': false,
            }],
          }],
          'triggerEvent': 'buttonDown',
          'triggerEventTimeMs': 0,
        },
      };
      handlerInput.responseBuilder.addDirective(buttonDownDirective);
    }
  },
  turnOffButtons: function(handlerInput) {
    if (module.exports.supportButtons(handlerInput)) {
      const turnOffButtonDirective = {
        'type': 'GadgetController.SetLight',
        'version': 1,
        'targetGadgets': [],
        'parameters': {
          'animations': [{
            'repeat': 1,
            'targetLights': ['1'],
            'sequence': [
              {
                'durationMs': 400,
                'color': '000000',
                'blend': false,
              },
            ],
          }],
          'triggerEvent': 'none',
          'triggerEventTimeMs': 0,
        },
      };

      handlerInput.responseBuilder
        .addDirective(turnOffButtonDirective);
    }
  },
  lightPlayer: function(handlerInput) {
    if (module.exports.supportButtons(handlerInput)) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      if (attributes.temp.buttons) {
        if (attributes.temp.buttons.hold) {
          const holdDirective = {
            'type': 'GadgetController.SetLight',
            'version': 1,
            'targetGadgets': [attributes.temp.buttons.hold],
            'parameters': {
              'animations': [{
                'repeat': 1,
                'targetLights': ['1'],
                'sequence': [{
                  'durationMs': 60000,
                  'color': '00FF00',
                  'blend': false,
                }],
              }],
              'triggerEvent': 'none',
              'triggerEventTimeMs': 0,
            },
          };
          handlerInput.responseBuilder.addDirective(holdDirective);
        }
        if (attributes.temp.buttons.discard) {
          const discardDirective = {
            'type': 'GadgetController.SetLight',
            'version': 1,
            'targetGadgets': [attributes.temp.buttons.discard],
            'parameters': {
              'animations': [{
                'repeat': 1,
                'targetLights': ['1'],
                'sequence': [{
                  'durationMs': 60000,
                  'color': '0000FF',
                  'blend': false,
                }],
              }],
              'triggerEvent': 'none',
              'triggerEventTimeMs': 0,
            },
          };
          handlerInput.responseBuilder.addDirective(discardDirective);
        }
      }
    }
  },
  addLaunchAnimation: function(handlerInput) {
    if (module.exports.supportButtons(handlerInput)) {
      // Flash the buttons white during roll call
      // This will intensify until it completes,
      // after the timeout it will auto-start the game
      const buttonIdleDirective = {
        'type': 'GadgetController.SetLight',
        'version': 1,
        'targetGadgets': [],
        'parameters': {
          'animations': [{
            'repeat': 1,
            'targetLights': ['1'],
            'sequence': [],
          }],
          'triggerEvent': 'none',
          'triggerEventTimeMs': 0,
        },
      };

      // Add to the animations array
      // This ends up finishing in about 40 seconds
      const sequence = [2500, 2500, 2500, 2500, 2500,
        1200, 1200, 1200, 1200, 1200, 1200,
        600, 600, 600, 600,
        300, 300, 300, 300];
      sequence.forEach((time) => {
        buttonIdleDirective.parameters.animations[0].sequence.push({
          'durationMs': time,
          'color': 'FFFFFF',
          'blend': true,
        });
        buttonIdleDirective.parameters.animations[0].sequence.push({
          'durationMs': (time * 3) / 4,
          'color': '000000',
          'blend': true,
        });
      });
      handlerInput.responseBuilder.addDirective(buttonIdleDirective);
    }
  },
};
