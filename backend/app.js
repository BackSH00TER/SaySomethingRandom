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
const uuidv4 = require('uuid/v4');
const https = require('https');
const dynamodb = new AWS.DynamoDB.DocumentClient({region: 'us-east-1'})
const tableName = 'SaySomethingRandom_Phrases';

app.set('view engine', 'pug')

if (process.env.NODE_ENV === 'test') {
  // NOTE: aws-serverless-express uses this app for its integration tests
  // and only applies compression to the /sam endpoint during testing.
  router.use('/sam', compression())
} else {
  router.use(compression())
}

// TODO: Get secret for JWT (i think)
// const secret = Buffer.from(SECRET, 'base64');
router.use(cors())
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))
router.use(awsServerlessExpressMiddleware.eventContext())

// NOTE: tests can't find the views directory without this
app.set('views', path.join(__dirname, 'views'))

// TODO: app.use(jwt...)

router.get('/', (req, res) => {
  res.render('index', {
    apiUrl: req.apiGateway ? `https://${req.apiGateway.event.headers.Host}/${req.apiGateway.event.requestContext.stage}` : 'http://localhost:3000'
  })
})

router.get('/sam', (req, res) => {
  res.sendFile(`${__dirname}/sam-logo.png`)
})

router.get('/phrases', async (req, res) => {
  let phrases = await getPhrasesByChannel(req.query.channelId);
  res.json(phrases);
})

router.post('/phrase', async (req, res) => {
  // let {channelId, clientId} = req.body.auth;
  // let token = app.getToken(req);
  let post = await postPhrase(req.body);
  // let twitchpubsubPost = await postToTwitchPubSub('newphrase', token, channelId, clientId);
  // console.log('twitchpubsubPost', twitchpubsubPost);
  res.json(post);
})

router.put('/completed', async (req, res) => {
  let {channelId, clientId} = req.body.auth;
  let token = app.getToken(req);
  let put = await completePhrase(req.body);
  let twitchpubsubPost = await postToTwitchPubSub('phraseCompleted', token, channelId, clientId);
  console.log('twitchpubsubPost', twitchpubsubPost);
  res.json(put);
})

const postToTwitchPubSub = async (message, token, channelId, clientId) => {

}

const getPhrasesByChannel = async (channelId) => {
  const params = {
    TableName: tableName,
    ExpressionAttributeValues: {":channelId": channelId},
    KeyConditionExpression: "channelId = :channelId",
    // ProjectionExpression: "channelId, displayName, phrase" // only need to specify which attributes to return, otherwise returns all
  };

  try {
    const data = await dynamodb.query(params).promise();
    console.log('data returned', data);
    return data.Items;
  } catch (err) {
    console.log(err);
  }
}

const postPhrase = async (phraseBody) => { 
  const {channelId, userId, displayName, phrase} = phraseBody;
  const uuid = uuidv4(); // generates a unique id for the phrase
  const params = {
    TableName: tableName,
    Item: {
      channelId,
      userId,
      displayName,
      phrase,
      uuid,
      completed: false
    }
  };

  try {
    const data = await dynamodb.put(params).promise();
    console.log(data);
    return data;
  } catch (err) {
    console.log(err);
    return err;
  }
}

const completePhrase = async (channelId) => { }


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