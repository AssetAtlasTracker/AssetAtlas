# AssetAtlas Container Registry Info

This document contains information about running AssetAtlas from our container registry, which lets you run AssetAtlas from the command line and with a more minimal initial download.

## About

AssetAtlas is a digital item management and cataloguing system similar to Item Genie and Home Box. Users are able to create digital representations of their belongings along with templates for those items. More information can be found in the AssetAtlas application.


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

If you aren't familiar with how to get your tailscale auth key, an introduction can be found [here](https://tailscale.com/kb/1085/auth-keys).

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
