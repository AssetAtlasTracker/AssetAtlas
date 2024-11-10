# Asset Atlas

TODO @Team description of what this project is and what it does

## End User Setup

### Multi device pre-setup

1. Make a Tailscale account
   - <https://login.tailscale.com/login>
   - Sign in with github is easiest
   <!-- - Rob: I created a tailnet for our org but not technically needed. We probably can't use it or will have to get an open source plan for it because it has a limit of 3 users -->
   - This will ask you to also download and set up tailscale on 2 devices. Do this on the server you'll be hosting from and your phone, or use the skip button.
1. Create a Tailscale auth key
   - <https://login.tailscale.com/admin/settings/keys>
   - "Auth keys"
   - TODO it forces an expiry of 90 days, can/should we do anything about this?
   - Set to **reusable** and **ephemeral**
   - **SAVE THIS KEY FOR LATER**
     - TODO move this step until later so people can directly put their tailscale key into their .env file?

### Main setup

1. Install Docker
   - <https://www.docker.com/products/docker-desktop/>
1. Clone the repository
1. Run start.py file (ex. `python .\start.py`)
1. If you are running tailscale for the first time, paste your key into the box and click "Save Auth Key".
1. Select local host or tailscale mode and click "Run Docker Compose" (This may take ~15 seconds)
   - If the compose action fails, docker may not be open/running (You may also need to run `npm i` in the project directory)
   - Once it finishes, a window will pop up "Service is running" with the IP
1. Go to the localhost URL or the tailscale URL (Tailsale must be running on the device for tailscale to work)
   - Rob: When I do this, I get a webpage that says "Not found"

## Developer Setup

TODO @Team directions about what Node version, Python version, and IDE to use on your host machine, installing deps

- Separate setup directions for developers/users (probably in different files)
  - Example: End users do not need node deps installed in their host machine
- Suggest using [nvm-windows](https://github.com/coreybutler/nvm-windows) to manage node installs

### To run linter

`npm run lint`

### To run tests

`npm run test`
