# Asset Atlas

TODO @Team description of what this project is and what it does

## End User Setup

### Multi device pre-setup

1. Make a Tailscale account
   - <https://login.tailscale.com/login>
   - Sign in with github is easiest
   <!-- - Rob: I created a tailnet for our org but not technically needed. We probably can't use it or will have to get an open source plan for it because it has a limit of 3 users -->
   - You will need to download the tailscale software on any device you want to use over the internet, such as a phone (It has an app). You actually don't need to download it on the device you host from, as docker handles this.

### Main setup

1. Install Docker
   - <https://www.docker.com/products/docker-desktop/>
1. Clone the repository
1. Run start.py file (ex. `python .\start.py`)
1. If you are running tailscale mode for the first time, do
   1. Create a Tailscale auth key
   1. <https://login.tailscale.com/admin/settings/keys>
   1. "Auth keys"
   1. TODO it forces an expiry of 90 days, can/should we do anything about this?
   1. Set to **reusable** and **ephemeral**
   1. Paste this in the auth key box and click save. You only need to do this once.
1. Select local host or tailscale mode and click "Run Docker Compose" (This may take ~15 seconds)
   - If the compose action fails, docker may not be open/running (You may also need to run `npm i` in the project directory)
   - Once it finishes, a window will pop up "Service is running" with the IP
1. Go to the localhost URL or the tailscale URL (Tailsale must be running on the device for tailscale to work)

## Developer Setup

- Use node 22, it might also work with other node versions but we are developing with node 22
- If package-lock isn't generated somewhere, you will need to run npm i first as docker uses the one from the project and does not generate its own automatically

- Separate setup directions for developers/users (probably in different files)
  - Example: End users do not need node deps installed in their host machine
- Suggest using [nvm-windows](https://github.com/coreybutler/nvm-windows) to manage node installs

### To run linter

`npm run lint`

### To run tests

`npm run test`
- These tests are only do backend databse stuff and API calls, so they don't check for docker, tailscale, or frontend functionality
