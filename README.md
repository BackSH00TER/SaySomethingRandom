# SaySomethingRandom
SaySomethingRandom Twitch Extension


# How to Run
View the README's in backend and frontend

Quick start:

- Backend
   - Use `sam local start-api` to spin up local docker to run against endpoints
      - Must have Docker already running locally
  - Deploy
    - `npm run win-package-deploy`

- Frontend
    - open developer rig and click start front end from there
        - then go to extension views
   - yarn start (??)
   - Deploy
     - `npm run build` - will use webpack to compress and build files, outputs to dist/ folder
     - Then zip the files and upload on Twitch
     > NOTE: Make sure all the files are at the root level of the .zip and not inside a folder


# Extension Testing
In order to test on Twitch page while running locally:
- Start front end and backend
- Need to enable extension on page
- Need to open a browser tab and go to https://localhost:8080/ and then click accept
- Then go back to twitch page and it should load properly


# Testing Instructions

- Suggestions Tab
  - Loading spinner while it first loads
  - If no content exists yet, a placeholder is displayed
  - If content exists, displays list of suggestions
  - If user is broadcaster or mod (and modControl config is true) then user will also see Complete/Reject buttons
    - On click of complete/reject the item is removed from the list and a pub sub event is fired updating all clients for the channel
  - As new suggestions are added they should automatically update in the list

- Add Suggestion Tab
  - If broadcaster does not have bits enabled - msg is displayed and send button and text area disabled
  - If user not logged in - msg is displayed informing user they need to login
  - If user tries to send empty msg, validation err is displayed
  - On click of send button, bits transaction flow begins
    - Text area and send button disabled while in the flow
    - If user clicks cancel the fields are re-enabled
    - If user clicks confirm, spinner appears while saving the suggestion
    - On successful send, user presented with success screen
      - Backennd sends a pubsub event trigger clients to update the suggestions list
      - Clicking Submit another resets the fields
    - In the rare event that the send fails (backend service err), the user is presented with an err msg

- Configuration Page
  - Broadcaster chooses bits amount per suggestion
  - Broadcaster chooses whether they want to allow their mods to be able to help mark suggestions as complete/rejected