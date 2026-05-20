#!/bin/sh
set -e

echo "Starting AssetAtlas..."
echo "Current working directory: $(pwd)"
echo "Running as user: $(id)"

# Set working directory
cd /usr/src/app
echo "Changed to: $(pwd)"
echo "Files in current dir: $(ls -la)"

# Create the .env file
mkdir -p /usr/src/app/docker
echo "IP=${IP:-localhost:3000}" > /usr/src/app/docker/.env
echo "Created .env file at /usr/src/app/docker/.env"

# Run the command passed in
echo "Executing: $@"
exec "$@"
