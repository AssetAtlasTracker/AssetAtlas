## Developer Setup

- Use node 22, it might also work with other node versions but we are developing with node 22

- Get docker

- Clone the repo

- Push early and often!

- Consider using [nvm-windows](https://github.com/coreybutler/nvm-windows) to manage node installs

- For development use start.py

### Troubleshooting

- Restart docker engine

- Delete docker images and containers (sometimes cache issues)

- Can take like ~3 minutes to build containers with no cache on Rose laptops

- Delete repo and clone again from github

- Restart PC

- Run VS code/docker as administrator

### To run linter

`npm run lint`

### To run tests

`npm run test`
- These tests are only do backend databse stuff and API calls, so they don't check for docker, tailscale, or frontend functionality
