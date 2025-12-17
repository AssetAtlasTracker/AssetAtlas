# Developer Setup

1. Get [Visual Studio Code](https://code.visualstudio.com/) or a fork
2. Get node 22.21.x (check with `node --version`)
   - It might also work with other node versions but we are developing with node 22.21.1
   - Consider using [nvm-windows](https://github.com/coreybutler/nvm-windows) to manage node installs
3. Get python 3.11.x (check with `python --version`)
    - Python is only used in this project for a development time utility
    - It might also work with other python versions but we are developing with python 3.11.9
    - Consider using [pyenv-win](https://github.com/pyenv-win/pyenv-win) to manage python installs
4. Get [Docker Desktop](https://www.docker.com/)
5. Clone the repo
   - If developing in VSCode, you should get prompted to install recommended extensions. Click "Install" to automatically install those extensions.
6. Install node dependencies for development via `npm install` in the base folder of the repo
7. Start Docker Desktop
8. Create `docker/secrets.env` by copying `docker/secrets.env.example` and filling in the necessary OAuth provider credentials. You can either go to the pinned messages in general in discord to find our current local dev secrets, or configure your own via the directions in [`ConfiguringOauthProviders.md`](../.github/assetatlas/ConfiguringOauthProviders.md)
9. Launch the docker compose via the helper script. Run `python start.py` in the base folder of the repo
10. A new window with various start up options should appear. Choose your desired options and press 'Run Docker Compose' to start the app. This may take several minutes
11. A popup will appear with the URL to access the frontend. Or if something went wrong, error details will be shown in the terminal you launched the helper script from.

## Best Practices

- Commit early and often!
- Run the linter and tests frequently
  - `npm run lint` and `npm run test` respectively
- Run code coverage as needed
  - `npm run coverage`
- Name PRs according to [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specifications

## Project Structure

- `/src` - Main project files. Most of your work will be here
  - `../controllers` - Contains code that will be executed when a route is accessed. Must be linked to a route through a routing file in the `../routes` directory
  - `../models` - Contains information on the code representation of database objects
  - `../routes` - Contains code related to routing. Essentially, code that says "when I go to 'example.com' this code should run"
  - `../stores` - Contains information on Stores, a feature from Svelte
  - `../svelteComponents` - Reusable components that can be included in other components or in pages
  - `../sveltePages` - Actual pages a user can access
  - `../svelteStyles` - CSS styling files for the pages and components
- `/tests` - Folder containing tests
  - `../resource` - Contains resource files used in testing.
- `/docs` - Folder containing documentation related to the project. No code should be here unless it's for the sake of documentation
  - `24-25` - Folder containing documentation from the 2024-2025 team of Asset Atlas
- `/docker` - Folder containing Docker stuff
  - `secrets.env` - OAuth tokens for the login system go here

## Troubleshooting

- Restart docker engine

- Delete docker images and containers (sometimes cache issues)

- Can take like ~3 minutes to build containers with no cache on Rose laptops

- Delete repo and clone again from github

- Restart PC

- Run VS code/docker as administrator
