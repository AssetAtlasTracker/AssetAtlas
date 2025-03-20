Run the following commands in the same directory where the docker-compose.yml files are located.

### localhost

```bash
# Windows
$env:DOCKER_IMAGE="ghcr.io/assetatlastracker/assetatlas:latest"; docker-compose -f docker-compose-ghcr.yml up -d

# Linux/macOS
DOCKER_IMAGE=ghcr.io/assetatlastracker/assetatlas:latest docker-compose -f docker-compose-ghcr.yml up -d
```

Then access database in browser at localhost:3000.

### tailscale

```bash
# Windows
$env:DOCKER_IMAGE="ghcr.io/assetatlastracker/assetatlas-tailscale:latest"; $env:TS_AUTH_KEY="your-tailscale-auth-key"; docker-compose -f docker-compose-ghcr-tailscale.yml up -d

# Linux/macOS
DOCKER_IMAGE=ghcr.io/assetatlastracker/assetatlas-tailscale:latest TS_AUTH_KEY=your-tailscale-auth-key docker-compose -f docker-compose-ghcr-tailscale.yml up -d
```

Replace `your-tailscale-auth-key` with your actual Tailscale auth key. You should only need to set this once, after that you can leave out the line
```
$env:TS_AUTH_KEY="your-tailscale-auth-key";
```
Will need to reset it though after your key expires.

### Getting Tailscale IP Address

For now just go to https://login.tailscale.com/admin/machines and find the IP associated with assetatlas-ts. Then in browser it will be [that ip]:3000 to access the database. Might make better later.

### Manual container build and push (developer stuff)

```bash
.\build-and-push-ghcr.bat AssetAtlasTracker AssetAtlas
```

And then provide a personal access token with package permissions.