var mainApp = require('./index');

const attributeFile = 'attributes.txt';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const fs = require('fs');

const LOCALE='de-DE';
const APPID = 'amzn1.ask.skill.115099ae-4d44-4d1c-aa99-634f34acf802';

function BuildEvent(argv)
{
  // Templates that can fill in the intent
  const yes = {'name': 'AMAZON.YesIntent', 'slots': {}};
  const no = {'name': 'AMAZON.NoIntent', 'slots': {}};
  const help = {'name': 'AMAZON.HelpIntent', 'slots': {}};
  const repeat = {'name': 'AMAZON.RepeatIntent', 'slots': {}};
  const fallback = {'name': 'AMAZON.FallbackIntent', 'slots': {}};
  const stop = {'name': 'AMAZON.StopIntent', 'slots': {}};
  const cancel = {'name': 'AMAZON.CancelIntent', 'slots': {}};
  const highscore = {'name': 'HighScoreIntent', 'slots': {}};
  const suggest = {'name': 'SuggestIntent', 'slots': {}};
  const previous = {'name': 'AMAZON.PreviousIntent', 'slots': {}};
  const play = {'name': 'PlayIntent', 'slots': {}};
  const name = {'name': 'ChangeNameIntent', 'slots': {'Name': {'name': 'Name', 'value': ''}}};
  var returnEvent;

  var lambda = {
    "session": {
      "sessionId": "SessionId.c88ec34d-28b0-46f6-a4c7-120d8fba8fa7",
      "application": {
        "applicationId": APPID
      },
      "attributes": {},
      "user": {
        "userId": "not-amazon",
      },
      "new": false
    },
    "request": {
      "type": "IntentRequest",
      "requestId": "EdwRequestId.26405959-e350-4dc0-8980-14cdc9a4e921",
      "locale": LOCALE,
      "timestamp": "2016-11-03T21:31:08Z",
      "intent": {}
    },
    "version": "1.0",
     "context": {
       "AudioPlayer": {
         "playerActivity": "IDLE"
       },
       "Display": {},
       "System": {
         "application": {
           "applicationId": APPID
         },
         "user": {
           "userId": "not-amazon",
         },
         "device": {
           "deviceId": "not-amazon",
           "supportedInterfaces": {
             "AudioPlayer": {},
             "Display": {
               "templateVersion": "1.0",
               "markupVersion": "1.0"
             }
           }
         },
         "apiEndpoint": "https://api.amazonalexa.com",
         "apiAccessToken": "",
       }
     },
  };

  var buttonEvent = {
    "session": {
      "sessionId": "SessionId.c88ec34d-28b0-46f6-a4c7-120d8fba8fa7",
      "application": {
        "applicationId": APPID
      },
      "attributes": {},
      "user": {
        "userId": "not-amazon",
      },
      "new": false
    },
    "request": {
      "type": "GameEngine.InputHandlerEvent",
      "requestId": "amzn1.echo-api.request.f25e7902-62bc-4661-90d9-aaac30c1a937",
      "timestamp": "2018-08-02T01:05:33Z",
      "locale": LOCALE,
      "originatingRequestId": "amzn1.echo-api.request.0b7a4f65-115d-427c-9aa0-5c78c57c740f",
      "events": [
        {
          "name": "button_down_event",
          "inputEvents": [
            {
              "gadgetId": "1",
              "timestamp": "2018-08-02T01:05:29.371Z",
              "color": "000000",
              "feature": "press",
              "action": "down"
            }
          ]
        }
      ]
    },
    "version": "1.0",
     "context": {
       "AudioPlayer": {
         "playerActivity": "IDLE"
       },
       "Display": {},
       "System": {
         "application": {
           "applicationId": APPID
         },
         "user": {
           "userId": "not-amazon",
         },
         "device": {
           "deviceId": "not-amazon",
           "supportedInterfaces": {
             "AudioPlayer": {},
             "Display": {
               "templateVersion": "1.0",
               "markupVersion": "1.0"
             }
           }
         },
         "apiEndpoint": "https://api.amazonalexa.com",
         "apiAccessToken": "",
       }
     },
  };

  var openEvent = {
    "session": {
      "sessionId": "SessionId.c88ec34d-28b0-46f6-a4c7-120d8fba8fa7",
      "application": {
        "applicationId": APPID
      },
      "attributes": {},
      "user": {
        "userId": "not-amazon",
      },
      "new": true
    },
    "request": {
      "type": "LaunchRequest",
      "requestId": "EdwRequestId.26405959-e350-4dc0-8980-14cdc9a4e921",
      "locale": LOCALE,
      "timestamp": "2016-11-03T21:31:08Z",
      "intent": {}
    },
    "version": "1.0",
     "context": {
       "AudioPlayer": {
         "playerActivity": "IDLE"
       },
       "Display": {},
       "System": {
         "application": {
           "applicationId": APPID
         },
         "user": {
           "userId": "not-amazon",
         },
         "device": {
           "deviceId": "not-amazon",
           "supportedInterfaces": {
             "AudioPlayer": {},
             "Display": {
               "templateVersion": "1.0",
               "markupVersion": "1.0"
             }
           }
         },
         "apiEndpoint": "https://api.amazonalexa.com",
         "apiAccessToken": "",
       }
     },
  };

  const canFulfill = {
   "session":{
     "new": true,
     "sessionId":"SessionId.12",
     "application":{
       "applicationId": APPID
     },
     "attributes":{
       "key": "string value"
     }
   },
   "request":{
     "type":"CanFulfillIntentRequest",
     "requestId":"EdwRequestId.12",
     "intent":{
       "name":"ChangeNameIntent",
       "slots":{
         "Name":{
           "name":"Name",
           "value":"Barney"
         },
       }
     },
     "locale":LOCALE,
     "timestamp":"2017-10-03T22:02:29Z"
   },
   "context":{
     "AudioPlayer":{
       "playerActivity":"IDLE"
     },
     "System":{
       "application":{
         "applicationId": APPID
       },
       "device":{
         "supportedInterfaces":{
         }
       }
     }
   },
   "version":"1.0"
  };

  // If there is an attributes.txt file, read the attributes from there
  if (fs.existsSync(attributeFile)) {
    data = fs.readFileSync(attributeFile, 'utf8');
    if (data) {
      lambda.session.attributes = JSON.parse(data);
      buttonEvent.session.attributes = JSON.parse(data);
    }
  }

  // If there is no argument, then we'll just return
  returnEvent = lambda;
  if (argv.length <= 2) {
    console.log('I need some parameters');
    return null;
  } else if (argv[2] == "seed") {
    if (fs.existsSync("seed.txt")) {
      data = fs.readFileSync("seed.txt", 'utf8');
      if (data) {
        return JSON.parse(data);
      }
    }
  } else if (argv[2] == 'repeat') {
    lambda.request.intent = repeat;
  } else if (argv[2] == 'launch') {
    returnEvent = openEvent;
  } else if (argv[2] == 'name') {
    if (argv.length > 3) {
      name.slots.Name.value = argv[3];
    }
    lambda.request.intent = name;
  } else if (argv[2] == 'button') {
    if (argv.length > 3) {
      buttonEvent.request.events[0].inputEvents[0].gadgetId = argv[3];
    }
    returnEvent = buttonEvent;
  } else if (argv[2] == 'play') {
    lambda.request.intent = play;
  } else if (argv[2] == 'highscore') {
    lambda.request.intent = highscore;
  } else if (argv[2] == 'help') {
    lambda.request.intent = help;
  } else if (argv[2] == 'fallback') {
    lambda.request.intent = fallback;
  } else if (argv[2] == 'suggest') {
    lambda.request.intent = suggest;
  } else if (argv[2] == 'stop') {
    lambda.request.intent = stop;
  } else if (argv[2] == 'cancel') {
    lambda.request.intent = cancel;
  } else if (argv[2] == 'previous') {
    lambda.request.intent = previous;
  } else if (argv[2] == 'yes') {
    lambda.request.intent = yes;
  } else if (argv[2] == 'no') {
    lambda.request.intent = no;
  } else if (argv[2] == 'canfulfill') {
    return canFulfill;
  }
  else {
    console.log(argv[2] + ' was not valid');
    return null;
  }

  // Write the last action
  fs.writeFile('lastaction.txt', JSON.stringify(returnEvent), (err) => {
    if (err) {
      console.log(err);
    }
  });

  return returnEvent;
}

function ssmlToText(ssml) {
  let text = ssml;

  // Replace break with ...
  text = text.replace(/<break[^>]+>/g, ' ... ');

  // Remove all other angle brackets
  text = text.replace(/<\/?[^>]+(>|$)/g, '');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

// Simple response - just print out what I'm given
function myResponse(appId) {
  this._appId = appId;
}

function myResponse(err, result) {
  // Write the last action
  fs.writeFile('lastResponse.txt', JSON.stringify(result), (err) => {
    if (err) {
      console.log('ERROR; ' + err.stack);
    } else if (!result.response || !result.response.outputSpeech) {
      console.log('RETURNED ' + JSON.stringify(result));
    } else {
      if (result.response.outputSpeech.ssml) {
        console.log('AS SSML: ' + result.response.outputSpeech.ssml);
        console.log('AS TEXT: ' + ssmlToText(result.response.outputSpeech.ssml));
      } else {
        console.log(result.response.outputSpeech.text);
      }
      if (result.response.card && result.response.card.content) {
        console.log('Card Content: ' + result.response.card.content);
      }
      console.log('The session ' + ((!result.response.shouldEndSession) ? 'stays open.' : 'closes.'));
      if (result.sessionAttributes && !process.env.NOLOG) {
        console.log('"attributes": ' + JSON.stringify(result.sessionAttributes));
      }
      if (result.sessionAttributes) {
        // Output the attributes too
        const fs = require('fs');
        fs.writeFile(attributeFile, JSON.stringify(result.sessionAttributes), (err) => {
          if (err) {
            console.log(err);
          }
        });
      }
    }
  });
}

// Build the event object and call the app
if ((process.argv.length == 3) && (process.argv[2] == 'clear')) {
  // Clear is a special case - delete this entry from the DB and delete the attributes.txt file
  dynamodb.deleteItem({TableName: 'ThreeCardPoker', Key: { id: {S: 'not-amazon'}}}, function (error, data) {
    console.log("Deleted " + error);
    if (fs.existsSync(attributeFile)) {
      fs.unlinkSync(attributeFile);
    }
  });
} else {
  var event = BuildEvent(process.argv);
  if (event) {
      mainApp.handler(event, null, myResponse);
  }
}
