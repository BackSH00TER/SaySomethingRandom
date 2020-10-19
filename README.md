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