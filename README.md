How to start this:

t.1. For multi device use you will need a tailscale account. If you dont care skip all the t steps.
t.2 make a tailscale account
t.3 you will need an auth key. make a tailscale auth key, and set it to ephemeral. (SAVE THIS KEY FOR LATER)
t.4 install tailscale on the devices you want to access from (i.e phone, laptop, honst computer if you want to test it on the same system)

1. Install docker
2. donwload the code
3. run the start.py file somehow
4. if you are running tailscale for the first time, paste your key into the box and save it.
5. select local host or tailscale mode and compile the dcoker containers. this will take like 15 seconds.
6. if the compose action fails, docker may not be running, you may also need to run npm i in the project directory.
7. go to the localhost URL or the tailscale URL (tailsale must be running on the device for tailscale to work)
