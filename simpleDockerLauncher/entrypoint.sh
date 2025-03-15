#!/bin/bash
set -e

# Check if we're in tailscale mode
if [ "$APP_MODE" = "tailscale" ]; then
    echo "Starting in Tailscale mode..."
    
    # Start tailscale in the background
    tailscaled --state=/var/lib/tailscale/tailscaled.state --socket=/var/run/tailscale/tailscaled.sock &
    
    # Wait for tailscale to start
    sleep 2
    
    # Start tailscale with the auth key
    tailscale up --authkey=${TS_AUTH_KEY} --hostname=assetatlas-ts
    
    # Print the tailscale IP
    TAILSCALE_IP=$(tailscale ip -4)
    echo "Tailscale IP: $TAILSCALE_IP"
    
    exec node dist/index.js
else
    exec node dist/index.js
fi
