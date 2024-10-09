# Start Guide

## Multi device pre-setup
1. Make a Tailscale account
2. Create a Tailscale auth key, and set it to **ephemeral** and **reusable**
   * **SAVE THIS KEY FOR LATER**
4. Install tailscale on the devices you want to access from (e.g. phone, laptop, host computer if you want to test it on the same system)

## Main setup
1. Install Docker
2. Dowload the code from the repository
3. Run start.py file *somehow*
   * If you are running tailscale for the first time, paste your key into the box and save it.
4. Select local host or tailscale mode and compile the dcoker containers. (This may take ~15 seconds)
   * If the compose action fails, docker may not be open/running (You may also need to run `npm i` in the project directory)
5. Go to the localhost URL or the tailscale URL (Tailsale must be running on the device for tailscale to work)
