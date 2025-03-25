Make sure to run these in the ghcr-files folder, and that docker is running

### Localhost

```bash
# Windows (PowerShell)
docker-compose -f docker-compose-ghcr.yml up -d

# Linux/macOS
docker-compose -f docker-compose-ghcr.yml up -d
```

### Tailscale

```bash
# Windows (PowerShell)
$env:TS_AUTH_KEY="your-tailscale-auth-key"; docker-compose -f docker-compose-ghcr-tailscale.yml up -d

# Linux/macOS
TS_AUTH_KEY="your-tailscale-auth-key" docker-compose -f docker-compose-ghcr-tailscale.yml up -d
```

Replace `your-tailscale-auth-key` with your actual Tailscale auth key. Should only need to include this once, then it is stored until it expires.

## Stopping the Containers

```bash
# Localhost
docker-compose -f docker-compose-ghcr.yml down

# Tailscale
docker-compose -f docker-compose-ghcr-tailscale.yml down
```

### Building and Pushing to GHCR (Development)

To manually build and push the container image to GitHub Container Registry:

```bash
.\docker\build-and-push.bat AssetAtlasTracker AssetAtlas
```

Enter your GitHub Personal Access Token with package write permissions.