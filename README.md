# AssetAtlas

AssetAtlas is a self hosted database with an object-oriented approach to keeping track of your stuff. In early development.

## End User Setup

### (Optional) Multi device remote access pre-setup

1. Make a Tailscale account
   - <https://login.tailscale.com/login>
   - Sign in however you like, but you will need to login once every 90 days to refresh your access key which is used in the software.
   <!-- - Rob: I created a tailnet for our org but not technically needed. We probably can't use it or will have to get an open source plan for it because it has a limit of 3 users -->
   - You will need to download the tailscale software on any device you want to use over the internet, such as a phone (It has an app). You will only need to download it on the host device if you would also like to access it from the host device while using multi-device mode.

### Main setup

1. Install Docker
   - <https://www.docker.com/products/docker-desktop/>
1. Clone the repository (if you dont know what that means you can just download a zip from the thing that pops up when you click "code" on the page linked below)
   - <https://github.com/AssetAtlasTracker/AssetAtlas>
1. Make sure you have Python downloaded
   - <https://www.python.org/downloads/>
1. Run the start.py file. It is located in the folder that was downloaded from this github page. You can right click on it and "Open with > python".
1. (Optional) If you are running tailscale mode (only needed if you want to remotley use the database from multiple devices) for the first time, do
   1. Create a Tailscale auth key
   1. <https://login.tailscale.com/admin/settings/keys>
   1. "Auth keys"
   1. Set to **reusable** and **ephemeral**
   1. Paste this in the auth key box and click save. You only need to do this once.
   1. Note: this is an authentication key that is stored in plain text on your host machine. If you already use Tailscale/a Tailnet for other things, they could be accessed by someone who has this key. If you are only using Tailscale for AssetAtlas this doesn't really matter as someone who can see this key already has access to your host computer and could see your database anyway.
1. Select local host or Tailscale mode and click "Run Docker Compose" (This may take like 5 minutes for the first time, will be much faster after)
   - If the compose action fails right away, docker may not be open/running. Make sure the "docker desktop" application you downloaded earlier is running.
   - Once it finishes, a window will pop up "Service is running" with the IP
1. Go to the localhost URL or the Tailscale URL (Tailsale must be running on the device trying to access for tailscale to work)

## Developer Setup

- Use node 22, it might also work with other node versions but we are developing with node 22

- Separate setup directions for developers/users (probably in different files)
  - Example: End users do not need node deps installed in their host machine
- Suggest using [nvm-windows](https://github.com/coreybutler/nvm-windows) to manage node installs

### To run linter

`npm run lint`

### To run tests

`npm run test`
- These tests are only do backend databse stuff and API calls, so they don't check for docker, tailscale, or frontend functionality
