### Localhost

```bash
# Windows (PowerShell)
$env:DOCKER_IMAGE="ghcr.io/assetatlastracker/assetatlas:latest"; docker-compose -f docker-compose-ghcr.yml up -d

# Linux/macOS
DOCKER_IMAGE=ghcr.io/assetatlastracker/assetatlas:latest docker-compose -f docker-compose-ghcr.yml up -d
```

### Tailscale

```bash
# Windows (PowerShell)
$env:DOCKER_IMAGE="ghcr.io/assetatlastracker/assetatlas:latest"; $env:TS_AUTH_KEY="your-tailscale-auth-key"; docker-compose -f docker-compose-ghcr-tailscale.yml up -d

# Linux/macOS
DOCKER_IMAGE=ghcr.io/assetatlastracker/assetatlas:latest TS_AUTH_KEY=your-tailscale-auth-key docker-compose -f docker-compose-ghcr-tailscale.yml up -d
```

Replace `your-tailscale-auth-key` with your actual Tailscale auth key

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