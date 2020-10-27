'use strict'
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const compression = require('compression')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const app = express()
const router = express.Router()
const AWS = require('aws-sdk')
const jwt = require('express-jwt')
const jsonwebtoken = require('jsonwebtoken');
const uuidv4 = require('uuid/v4');
const https = require('https');
const fetch = require('node-fetch');
const { ExtensionClientId, ExtensionSecret, TwitchAPIClientSecret, OwnerId } = require('./secrets');

const dynamodb = new AWS.DynamoDB.DocumentClient({region: 'us-east-1'})
const tableName = 'SaySomethingRandom_Phrases';
const bearerPrefix = 'Bearer ';
const secret = Buffer.from(ExtensionSecret, 'base64');

const EventType = {
  COMPLETED_PHRASE_EVENT: 'COMPLETED_PHRASE_EVENT',
  SEND_PHRASE_EVENT: 'SEND_PHRASE_EVENT'
};

// TODO: move this setting into a config file or something that can be imported to other files
const IS_DEV_MODE = false; // Set to true when running locally to prevent calling real services

app.set('view engine', 'pug')

if (process.env.NODE_ENV === 'test') {
  // NOTE: aws-serverless-express uses this app for its integration tests
  // and only applies compression to the /sam endpoint during testing.
  router.use('/sam', compression())
} else {
  router.use(compression())
}

// TODO: Get secret for JWT (i think)
// Tutorial: https://dev.twitch.tv/docs/tutorials/extension-101-tutorial-series/jwt
// const secret = Buffer.from(SECRET, 'base64');
router.use(cors())
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))
router.use(awsServerlessExpressMiddleware.eventContext())

// NOTE: tests can't find the views directory without this
app.set('views', path.join(__dirname, 'views'))

// TODO: Is this necessary?
// TODO: app.use(jwt...)

router.get('/', (req, res) => {
  res.render('index', {
    apiUrl: req.apiGateway ? `https://${req.apiGateway.event.headers.Host}/${req.apiGateway.event.requestContext.stage}` : 'http://localhost:3000'
  })
})

router.get('/sam', (req, res) => {
  res.sendFile(`${__dirname}/sam-logo.png`)
})

// Requires request must pass channelId
// Expected usage: `apiUrl/phrases?channelId=${channelId}`
router.get('/phrases', async (req, res) => {
  console.log('Endpoint /phrases, getting phrases...');
  let phrases = [];
  if (IS_DEV_MODE) {
    phrases = [
      {
        completed: false,
        phrase: 'My grandma once told me that I should always...',
        uuid: 'b7ce3137-3ba2-4f83-91ec-b6cf719e5345',
        channelId: '123455',
        userId: '6546546',
        displayName: 'User1234',
        dateCreated: 1603499959
      },
      {
        completed: false,
        phrase: 'Prank phone call someone',
        uuid: 'f0804227-0bab-464b-8ac8-2b7b6b47fe6f',
        channelId: '123455',
        userId: '6546548',
        displayName: 'User5678',
        dateCreated: 1603499642
      },
      {
        completed: false,
        phrase: 'Hide in the trunk!',
        uuid: 'f0804227-0bab-464b-8ac8-2b7b6b47f8756',
        channelId: '123455',
        userId: '6546548',
        displayName: 'UserWithATrulyExtremelyVeryOutstandinlyLongNameThatWillMostCertainlyExceedTheWidth',
        dateCreated: 1603499680
      },
      {
        completed: true,
        phrase: 'Completed Post (should be filtered out)',
        uuid: 'f0804227-0bab-464b-8ac8-2b7b6b4729',
        channelId: '123455',
        userId: '6546879',
        displayName: 'CompletedUser',
        dateCreated: 1603499540
      }
    ];
  } else {
    console.log('Endpoint /phrases called with channelId: ', req.query.channelId);
    phrases = await getPhrasesByChannel(req.query.channelId);
  }

  console.log(`Phrases for channelId: ${req.query.channelId} : ${phrases}`);

  console.log('Sorting phrases...');
  const sortedPhrases = sortPhrasesByOldestDate(phrases);

  res.json(sortedPhrases);
})

// Creates/adds a phrase
router.post('/phrase', async (req, res) => {
  console.log('Endpoint /phrase, beginning phrase post...');
  let userId;
  let displayName;
  // If the req body has a transactionObject, this means that the user completed a bits transaction
  if (req.body.transactionObject) {
    console.log('TransactionObject received: ', req.body.transactionObject);
    // The transactionReceipt is a JWT, and we need to verify that it is valid
    if (!IS_DEV_MODE) {
      req.body.transactionObject.transactionReceipt && verifyAndDecode(req.body.transactionObject.transactionReceipt);
    }
    userId = req.body.transactionObject.userId;
    displayName = req.body.transactionObject.displayName;
  }

  const jwt = req.headers.authorization;
  const decodedJWT = verifyAndDecode(jwt);

  // If user is not logged in, then do nothing
  const isLoggedIn = decodedJWT.opaque_user_id[0] === 'U' ? true : false;
  if (!isLoggedIn) {
    console.error('Error: User tried to send a phrase but they are not logged in');
    res.json(null);
    return;
  }

  const {channel_id: channelId } = decodedJWT;

  try {
    if (!displayName) { // Checks if already has displayName from transactionObject
      displayName = await getUserById(userId);
    }
  } catch (err) {
    // If unable to get users displayName, then do nothing
    console.error(`Error getting user displayName from userId: ${userId}. Error is: ${err}`);
    res.json(null);
    return;
  }
  const body = {
    phrase: req.body.phrase,
    channelId,
    userId,
    displayName
  };

  let postResult = {};
  if (IS_DEV_MODE) {
    postResult = {
      completed: false,
      phrase: `MOCK: ${req.body.phrase}`,
      uuid: '12345-6789',
      channelId: '123455',
      userId: '123455',
      displayName: 'Mock user'
    };
    setTimeout(() => {}, 500); // delay just for mock
  } else {
    // Returns empty object {} on success (Status 204)
    postResult = await postPhrase(body);
    console.log('Phrase posted:', postResult)

    // TODO: Return something to show success/failure
    // TODO: Should be able to cehck that status is 204... possibly just result.status?
    // TODO: Come up with and use common response across all endpoints
  }

  await sendToChat(channelId, postResult);

  console.log('Posting PubSub event...');
  await postToTwitchExtPubSub(channelId, postResult, EventType.SEND_PHRASE_EVENT);
  console.log('PubSub event posted. Returning response');

  res.json(postResult);
})

router.put('/completed', async (req, res) => {
  console.log('Endpoint /completed ...');
  const jwt = req.headers.authorization;
  const decodedJWT = verifyAndDecode(jwt);
  let {channel_id: channelId, role } = decodedJWT;

  // Need to verify here that user isMod, we check clientSide but can't trust that
  // If user is not mod or broadcaster, fail the action and don't proceed
  if (!(role === 'broadcaster' || role === 'moderator')) {
    console.error('Error: User is not the broadcaster or a mod and cannot complete the completePhrase action');
    res.status(400).json('USER_IS_NOT_MOD');
  }

  const body = {
    channelId: channelId,
    messageId: req.body.messageId,
    isRejected: req.body.isRejected
  };

  let result = {};
  if (IS_DEV_MODE) {
    result = {
      channelId,
      uuid: req.body.messageId
    };
  } else {
    result = await completePhrase(body);
    console.log('Phrase marked as completed:', result);
  }

  console.log('Posting PubSub event...');
  await postToTwitchExtPubSub(channelId, result, EventType.COMPLETED_PHRASE_EVENT);
  console.log('PubSub event posted. Returning response');

  res.json(result);
})


/**
 * Posts an updated event to the Twitch Extension PubSub (note: this is different than Twitch PubSub)
 * Broadcasts the message to the specified channelId, frontend should have a twitch.listen() to listen for the event.
 * Doc: https://dev.twitch.tv/docs/extensions/reference/#send-extension-pubsub-message
 * @param channelId -  channelId to update w/ message update event
 * @param messagePayload - object containing the message attributes
 * @param eventType - represents the type of event that is being sent
 */
const postToTwitchExtPubSub = async (channelId, messagePayload, eventType) => {
  console.log(`Posting to PubSub for channelId: ${channelId}, eventType: ${eventType}`);
  const pubSubPostUrl = `https://api.twitch.tv/extensions/message/${channelId}`;

  // Create a JWT for the server to use to post to pubsub (expires in 60 seconds)
  const serverAccessToken = makeServerToken(channelId);
  /**
   * Required body params for PubSub Post event:
   *    content_type  | string    | application/json
   *    message       | string    | message to be sent
   *    targets       | string[]  | valid values: ("broadcast", "global")
   */
  const message = {
    eventType,
    payload: messagePayload
  };

  const body = {
    message: JSON.stringify(message),
    targets: ['broadcast'],
    'content_type': 'application/json'
  };

  const options = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Client-ID': ExtensionClientId,
      Authorization: `Bearer ${serverAccessToken}`
    }
  };

  // Returns status 204 on success
  console.log('Trying to post PubSub event...');
  const result = await fetch(pubSubPostUrl, options);
  console.log('PubSub event result:', result);
  
  if (result.status !== 204) {
    const parsed = await result.json();
    console.error('ERROR posting to Twitch Pub Sub', parsed);
    // TODO: Error handling
  }
  return result;
}

const getPhrasesByChannel = async (channelId) => {
  const params = {
    TableName: tableName,
    ExpressionAttributeValues: {":channelId": channelId},
    KeyConditionExpression: "channelId = :channelId",
    // ProjectionExpression: "channelId, displayName, phrase" // only need to specify which attributes to return, otherwise returns all
  };

  try {
    console.log('Awaiting dynamodb.query w/ params:', params);
    const data = await dynamodb.query(params).promise();
    // console.log('data returned', data);
    return data.Items;
  }
  catch (err) {
    console.error(`Error querying dynamodb: ${err}`);
  }
}

// Returns the phrase object that was posted
const postPhrase = async (phraseBody) => { 
  const {channelId, userId, displayName, phrase} = phraseBody;
  const uuid = uuidv4(); // generates a unique id for the phrase
  const date = getEpochDateTime();
  const params = {
    TableName: tableName,
    Item: {
      channelId,
      userId,
      displayName,
      phrase,
      uuid,
      completed: false,
      isRejected: false,
      dateCreated: date
    }
  };

  // TODO: once babel is in and can use ES6 use object spread (...body) instead
  const postedPhrase = {
    channelId,
    userId,
    displayName,
    phrase,
    uuid,
    completed: false,
    isRejected: false,
    dateCreated: date
  };

  try {
    console.log('Awaiting dynamodb.put w/ params:', params);
    const data = await dynamodb.put(params).promise();
    return postedPhrase;
  }
  catch (err) {
    console.error(`Error putting data to dynamodb: ${err}`);
    return err;
  }
}

const completePhrase = async (args) => {
  const {channelId, messageId, isRejected} = args;

  /** ReturnValues:
   *   "ALL_NEW" - Returns all attributes of the update item
   *   "UPDATED_NEW" - Returns only the udpated attribute (in this case 'completed')
   */ 
  const params = {
    TableName: tableName,
    Key: {
      "channelId": channelId,
      "uuid": messageId
    },
    UpdateExpression: "set completed = :completed, isRejected = :isRejected",
    ExpressionAttributeValues: {
      ":completed": true,
      ":isRejected": isRejected
    },
    ReturnValues: "ALL_NEW"
  };

  try {
    // Returns all attributes of the updated item
    console.log('Awaiting dynamodb.update w/ params:', params);
    const data = await dynamodb.update(params).promise();

    return data.Attributes;
  }
  catch (err) {
    console.error(`Error updating data to dynamodb: ${err}`);
    return err;
  }
}

/**
 * Gets an app access token that can be used for server-to-server API requests
 * The appAccessToken returned can be used to call non privileged Twitch API endpoints
 * Uses the OAuth Client Credentials Flow as documented here: https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-client-credentials-flow
 * A successful request to the oauth2 endpoint returns data in the shape:
 *  { access_token: 'access_token', expires_in: 4788048, token_type: 'bearer'}
 * Returns the extracted appAccessToken
 */
const getAppAccessToken = async () => {
  const hostUrlPath = 'https://id.twitch.tv/oauth2/token';
  const fullUrl = `${hostUrlPath}?client_id=${ExtensionClientId}&client_secret=${TwitchAPIClientSecret}&grant_type=client_credentials`;
  try {
    const response = await fetch(fullUrl, {method: 'POST'});
    const data = await response.json();
    return data.access_token;
  } catch (err) {
    // TODO: handle err, if this fails we dont want to allow subsequent actions to continue as we need this to get user display name
    console.error(`Error getting app accessToken: ${err}`);
  }
}

const getUserById = async (userId) => {
  console.log(`Attempting to get user name from userId: ${userId}`)
  const url = `https://api.twitch.tv/helix/users?id=${userId}`;
  const appAccessToken = await getAppAccessToken();

  const options = {
    headers: {
        Authorization: `Bearer ${appAccessToken}`,
        'Client-ID': ExtensionClientId
    }
  };

  try {
    console.log('Awaiting response...');
    const response = await fetch(url, options);
    console.log('Response for userId is:', response);
    const responseData = await response.json();
    console.log('ResponseData json parsed:', responseData);
    const displayName = responseData.data[0].display_name;

    return displayName;
  }
  catch(err) {
    console.error(`Error getting userById: ${err}`); // TODO handle errors
    throw err;
  }
}

/** Verify the header and the enclosed JWT
 * There is no guarentee that the JWT token we get from the client is valid
 * So we use the extension client secret here to decode the JWT
 * If successful we get channel_id, user_id, role, opaque_user_id, etc
 * If JWT invalid, we don't want to allow the action to continue
*/
const verifyAndDecode = (authHeader) => {
  let token = authHeader;
  if (authHeader.startsWith(bearerPrefix)) {
    token = authHeader.substring(bearerPrefix.length);
  }
  try {
    return jsonwebtoken.verify(token, secret, { algorithms: ['HS256']});
  } catch (err) {
    return console.error('Error verifying token. Invalid JWT. Error: ', err); // TODO error handling
  }
}

const makeServerToken = (channelId) => {
  const serverTokenDurationSec = 60; // token for pubsub expires after 60 seconds
  const payload = {
    exp: Math.floor(Date.now() / 1000) + serverTokenDurationSec,
    channel_id: channelId,
    user_id: OwnerId, // extension owner ID for the call to Twitch PubSub
    role: 'external',
    pubsub_perms: {
      send: ['*'],
    },
  };
  return jsonwebtoken.sign(payload, secret, { algorithm: 'HS256' });
}

/**
 * Returns the epoch date time (time in seconds since Jan 1, 1970)
 * 
 */
const getEpochDateTime = () => {
  const date = new Date();
  // Need to return integer
  return Math.floor(date.getTime() / 1000);
}

/**
 * Sorts phrases by date returning oldest (smallest number) first
 * @param {array} phrases
 * @returns {array} sorted phrases 
 */
const sortPhrasesByOldestDate = (phrases) => {
  phrases.sort((date1, date2) => date1.dateCreated - date2.dateCreated);
  return phrases;
}

/**
 * Sends a message to the chat of the specified channelId
 * @param {string} channelId who's chat the message is sent to
 */
const sendToChat = async (channelId, postedPhrase) => {
  console.log('Sending message to channel...');
  const authToken = makeServerToken(channelId);

  const message = `@${postedPhrase.displayName} added the suggestion: "${postedPhrase.phrase}".`;
  const options = {
    method: 'POST',
    body: JSON.stringify({text: message}),
    headers: {
      'Content-Type': 'application/json',
      'Client-ID': ExtensionClientId,
      Authorization: `Bearer ${authToken}`
    }
  };

  // URL Version will need to change w/ version of app
  const url = `https://api.twitch.tv/extensions/${ExtensionClientId}/0.0.1/channels/${channelId}/chat`;

  const result = await fetch(url, options);
  
  if (result.status !== 204) {
    if(result.status === 429) {
      // Message rate limit is 12 msgs per minute
      console.error(`Error: Send to chat failed, rate limit reached for channelId: ${channelId}`);
    }
    const parsed = await result.json();
    console.error(`ERROR sending message to chat for channeldId: ${channelId}. Error: ${JSON.stringify(parsed)}`);
    // TODO: Error handling
    return result;
  }
  console.log('Message sent successfully');

  return result;
}

// The aws-serverless-express library creates a server and listens on a Unix
// Domain Socket for you, so you can remove the usual call to app.listen.
// app.listen(3000)
app.use('/', router)

// Export your express server so you can import it in the lambda function.
module.exports = app


/*
router.get('/', (req, res) => {
  res.render('index', {
    apiUrl: req.apiGateway ? `https://${req.apiGateway.event.headers.Host}/${req.apiGateway.event.requestContext.stage}` : 'http://localhost:3000'
  })
})

router.get('/sam', (req, res) => {
  res.sendFile(`${__dirname}/sam-logo.png`)
})

router.get('/users', (req, res) => {
  res.json(users)
})

router.get('/users/:userId', (req, res) => {
  const user = getUser(req.params.userId)

  if (!user) return res.status(404).json({})

  return res.json(user)
})

router.post('/users', (req, res) => {
  const user = {
    id: ++userIdCounter,
    name: req.body.name
  }
  users.push(user)
  res.status(201).json(user)
})

router.put('/users/:userId', (req, res) => {
  const user = getUser(req.params.userId)

  if (!user) return res.status(404).json({})

  user.name = req.body.name
  res.json(user)
})

router.delete('/users/:userId', (req, res) => {
  const userIndex = getUserIndex(req.params.userId)

  if (userIndex === -1) return res.status(404).json({})

  users.splice(userIndex, 1)
  res.json(users)
})

const getUser = (userId) => users.find(u => u.id === parseInt(userId))
const getUserIndex = (userId) => users.findIndex(u => u.id === parseInt(userId))

// Ephemeral in-memory data store
const users = [{
  id: 1,
  name: 'Joe'
}, {
  id: 2,
  name: 'Jane'
}]
let userIdCounter = users.length
*/