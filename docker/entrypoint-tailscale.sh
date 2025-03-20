#!/bin/bash
set -e

echo "Starting with Tailscale"

# Create the .env file if needed
if [[ "$SETUP_ENV_FILE" == "true" ]]; then
  echo "Creating .env file in the container"
  mkdir -p /usr/src/app/docker
  echo "IP=${IP:-localhost:3000}" > /usr/src/app/docker/.env
  echo "Created .env file at /usr/src/app/docker/.env"
fi

if [[ -z "$TS_AUTH_KEY" ]]; then
  echo "WARNING: TS_AUTH_KEY environment variable is NOT SET"
  echo "Tailscale will not be started automatically"
  echo "You may need to manually authenticate with 'tailscale up' later"
else
  echo "Initializing Tailscale..."
  tailscaled --state=/var/lib/tailscale/tailscaled.state --socket=/var/run/tailscale/tailscaled.sock &
  
  # Wait for tailscale to start
  sleep 2
  
  # Authenticate with Tailscale
  tailscale up --authkey="$TS_AUTH_KEY" --hostname="assetAtlas-ts"
  
  echo "Tailscale started successfully"
fi

exec "$@"