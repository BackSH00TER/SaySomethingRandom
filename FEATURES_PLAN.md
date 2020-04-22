# Say Something Random

## Overview
The plan is to make an extension that allows users to submit a word/phrase that they want the streamer to use as part of their RP scenario. The extension will have bits enabled and users will use a small amount of bits (~50-100) to submit their word/phrase.



## PLAN
### Front End
Will need some sort of PubSub to listen for new messages added to the backend
-- Twitch Extension helper should help with this
### Back End
- DynamoDB table to hold all input data
  - Table will have all data for all streams using skill
  - Table needs main key to be the channel_id (the broadcaster id) and sort key unique identifer id (uuid)
  - Potential attributes: channel_id, user_id, phrase, date/time, answered, dislayName
    - Decide if we delete the entry once its been answered or if want to store all old responses
    - If kept old responses could have a view for users to see past suggestions and maybe sort by diff users?

- Lambda Function to execute the stuff

#### Api Gateway for Endpoints
- GET /phrases/?channel_id={twitch channel user id to pull phrases}
- POST /phrase body = {user_id, channel_id, phrase, userDisplayName, timePosted}
- PUT /completed body = {id (of the phrase), completed (boolean)}

#### Functions to query DynamoDb
Using aws-sdk

- getPhrasesForChannel(channelId)
- postPhrase({channelId, userId, ....})
- completePhrase({phraseId, completed})



## VIEWS
### Panel
### Component (on screen)
- semi-transparent

- Main View (all): 
-----Header----
List of Phrases (in order of oldest -> newest (top to bottom))
- prop to toggleDisplayName of user who submitted phrase

-Main View (broadcaster):
-----Header----
List of Phrases (in order of oldest -> newest (top to bottom))
- each phrase has a `Mark Completed` button (removes from list and marks completed on backend / or removes from backend DB)
- prop to toggleDisplayName of user who submitted phrase

- Tab 2 (Add phrase)
-----Header------
Form field
QuickHelp info, says how many bits it will cost
Submit Button
- trigger validation on form field
-- validation checks against twitch auto mod (if possible)
-- or checks against bad words, etc (this could be a config option for broadcaster to choose what kind of filter to use)
-- triggers a are you sure, once click is final transaction kind of msg (twitch might provide this)
- allow user ability to edit message after submitted? (future)

- If Viewer Logged Out
-- Show msg and button to sign in to submit your own prhase

### ConfigPage
Needs to be legible (contrast) in light/dark themes
- Filter On yes/no
- showDisplayNameOfSuggester
- allow users to upvote other suggestions to top of the list?



## Resources
Example App Description: https://aws.amazon.com/blogs/gametech/build-a-twitch-extension-with-an-aws-serverless-backend/

Example App Repo: https://github.com/twitchdev/AskACaster
Used for middleware: https://github.com/awslabs/aws-serverless-express
**Follow tese steps to create Node.js project based on example** https://github.com/twitchdev/AskACaster/tree/master/backend


Youtube series: https://www.youtube.com/watch?v=YQA5Dt4TGrM
