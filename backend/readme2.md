## TIPS

SAM script is looking for the template file to be `template.yaml` the other scripts are looking for `cloudformation.yaml`, for now I'm duplicating this file. They are the same, if one is updated the other will need to be updated. 
- Eventually should try to consolidate and update the relevants scripts to point to the file.


To run backend locally:
- start docker
- Run `sam local start-api` to run docker container locally to test

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
