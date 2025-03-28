## AssetAtlas Container Registry Info

This document contains information about running AssetAtlas from our container registry, which lets you run AssetAtlas from the command line and with a more minimal initial download. Application data is NOT shared between the ghcr version and GUI-launched version as of (3/27/2025).

### Download Required Files

You can get the required files with either of these methods:

1. **Direct downloads**:
   - [Download ZIP with all files](https://github.com/AssetAtlasTracker/AssetAtlas/releases/latest/download/assetatlas-ghcr-files.zip) (probably do this)
   - [docker-compose-ghcr.yml](https://github.com/AssetAtlasTracker/AssetAtlas/releases/latest/download/docker-compose-ghcr.yml)
   - [docker-compose-ghcr-tailscale.yml](https://github.com/AssetAtlasTracker/AssetAtlas/releases/latest/download/docker-compose-ghcr-tailscale.yml)
   - [README.md](https://github.com/AssetAtlasTracker/AssetAtlas/releases/latest/download/README.md)

2. **Clone from GitHub**:
   ```bash
   # requires Node.js
   npx degit AssetAtlasTracker/AssetAtlas/ghcr-files assetatlas-ghcr
   ```

## Running the Container

Make sure to run these commands in the folder containing the docker-compose files, and that docker is running.

### Localhost

```bash
# Windows (PowerShell and bash) and Linux/macOS
docker-compose -f docker-compose-ghcr.yml up -d
```

### Tailscale

```bash
# Windows (PowerShell)
$env:TS_AUTH_KEY="your-tailscale-auth-key"; docker-compose -f docker-compose-ghcr-tailscale.yml up -d

# Linux/macOS or Windows (bash)
TS_AUTH_KEY="your-tailscale-auth-key" docker-compose -f docker-compose-ghcr-tailscale.yml up -d
```

Replace `your-tailscale-auth-key` with your actual Tailscale auth key.

## Stopping the Containers

```bash
# Localhost
docker-compose -f docker-compose-ghcr.yml down

# Tailscale
docker-compose -f docker-compose-ghcr-tailscale.yml down
```

### Building and Pushing to GHCR (Development)

Build is handled automatically when pushing to production branch. To manually build and push the container image to GitHub Container Registry:

```bash
.\docker\build-and-push.bat AssetAtlasTracker AssetAtlas
```

Enter your GitHub Personal Access Token with package write permissions.

This should be run in projects top level (the provided command includes the pathing to the docker subdirectory).