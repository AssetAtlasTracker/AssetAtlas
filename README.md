# AssetAtlas Container Registry Info

This document contains information about running AssetAtlas from our container registry, which lets you run AssetAtlas from the command line and with a more minimal initial download. Application data is NOT shared between the ghcr version and GUI-launched version as of (3/27/2025).

## Download Required Files

This application consists of multiple container images.
Docker Compose is used to configure and [run the images together](https://docs.docker.com/get-started/docker-concepts/running-containers/multi-container-applications/).

You can get the required files with either of these methods:

### a. Direct download

[Download ZIP with all files from the latest release](https://github.com/AssetAtlasTracker/AssetAtlas/releases/latest/download/assetatlas-ghcr-files.zip).

It contains the required docker-compose files and a copy of this readme.

### b. Clone from GitHub

Only do this if you'd like to get a development version.

```bash
# requires Node.js
npx degit AssetAtlasTracker/AssetAtlas/ghcr-files assetatlas-ghcr
```

## Running the Containers

Make sure to run these commands in the folder containing the docker-compose files, and that Docker is running.

Run either the Localhost or Tailscale version, depending on your needs.

### a. Localhost

Enables accessing AssetAtlas from the same device you're hosting it on.

For Windows (PowerShell and bash) and Linux/macOS (bash):

```bash
docker compose -f docker-compose-ghcr.yml up -d
```

### b. Tailscale

Enables using Tailscale to connect from other devices without additional network configuration.
Replace `your-tailscale-auth-key` with your actual Tailscale auth key.

TODO how to get a tailscale auth key?

For Windows (PowerShell):

```ps
$env:TS_AUTH_KEY="your-tailscale-auth-key"; docker-compose -f docker-compose-ghcr-tailscale.yml up -d
```

For Linux/macOS (bash) or Windows (bash):

```bash
TS_AUTH_KEY="your-tailscale-auth-key" docker compose -f docker-compose-ghcr-tailscale.yml up -d
```

## Stopping the Containers

```bash
# Localhost
docker compose -f docker-compose-ghcr.yml down

# Tailscale
docker compose -f docker-compose-ghcr-tailscale.yml down
```
