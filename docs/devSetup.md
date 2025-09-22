## Developer Setup

The information here is almost identical to the user setup found in the repo's README. Look there for more information on various startup options.

1. Get node 22 
    a. It might also work with other node versions but we are developing with node 22
    b. Consider using [nvm-windows](https://github.com/coreybutler/nvm-windows) to manage node installs
2. Get Docker

3. Clone the repo

4. Start [Docker Desktop](https://www.docker.com/)

5. Run `python start.py`

6. A new window with various start up options should appear. Choose your desired options and press 'Run Docker Compose' to start the app. This may take several minutes

7. Enter the url shown in your web browser search bar

### Best Practices

- Commit ealy and often!
- Run the linter and tests frequently
 - `npm run lint` and `npm run test` respectively
- Name PR's according to [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specifications

### Troubleshooting

- Restart docker engine

- Delete docker images and containers (sometimes cache issues)

- Can take like ~3 minutes to build containers with no cache on Rose laptops

- Delete repo and clone again from github

- Restart PC

- Run VS code/docker as administrator


