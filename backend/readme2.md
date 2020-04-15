## TIPS

Changing cloudformation.yaml to template.yaml so that sam local start-api can run it
- might have to reconfigure some of the scripts that are expecting a cloudformation.yaml file, or reconfigure the sam start-api to look for cloudformationl.yaml instead

Run `sam local start-api` to run docker container locally to test

Editing the backend/app.js file for endpoints

What I've done so far:
- Watching video
  - Got sam cli setup, `sam local start-api`
  - Docker setup - had to use linux container and share C: and D: drives
  - Can run locally now
    - can use **Postman query** to hit endpoints or browser
        - ex:  http://127.0.0.1:3000/phrases?channelId=12345


TODO: Setup rest of the endpoints

Link to example github is broken: this is similar tho
https://github.com/kneekey23/wedding
