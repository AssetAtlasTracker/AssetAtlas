#!/bin/bash
set -e

echo "Starting AssetAtlas..."

# Create the .env file
mkdir -p /usr/src/app/docker
echo "IP=${IP:-localhost:3000}" > /usr/src/app/docker/.env
echo "Created .env file at /usr/src/app/docker/.env"

# Ensure proper ownership of files
if [ "$(id -u)" = "0" ]; then
  chown -R node:node /usr/src/app
  # If running as root, switch to node user to run the application
  echo "Switching to node user..."
  exec su -c '"$0" "$@"' node -- "$@"
else
  exec "$@"
fi
