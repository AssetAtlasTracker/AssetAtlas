# Developer Setup

The information here is almost identical to the user setup found in the repo's README. Look there for more information on various startup options.

1. Get node 22
    1. It might also work with other node versions but we are developing with node 22
    2. Consider using [nvm-windows](https://github.com/coreybutler/nvm-windows) to manage node installs
2. Get Docker

3. Clone the repo
   1. If developing in VSCode, you may get prompted to install recommended extensions. Click "Install" to automatically install those extensions.

4. Start [Docker Desktop](https://www.docker.com/)

5. Run `python start.py` in the base folder of the repo

6. A new window with various start up options should appear. Choose your desired options and press 'Run Docker Compose' to start the app. This may take several minutes

7. Enter the url shown in your web browser search bar

## Best Practices

- Commit ealy and often!
- Run the linter and tests frequently
  - `npm run lint` and `npm run test` respectively
- Run code coverage as needed
  - `npm run coverage`
- Name PRs according to [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specifications

## Project Structure

For more information see the [SvelteKit docs](https://svelte.dev/docs/kit/project-structure)

- `/src` - Main project files. Most of your work will be here
  - `../lib` - Contains utilities and components. You can easily imports items from this directory using the `$lib` keyword
    - `../components` - Svelte components
    - `../server` - Code that should only run on the server should be placed here
    - `../stores` - Stores and related logic
    - `../styles` - CSS styling
    - `../utility` - Misc. utility code
  - `../routes` - Contains code related to routing. Essentially, code that says "when I go to 'example.com/items' this code should run". The name of the route is directly tied to the file structure.
- `/static` - Used for assets that should be served as-is, without any processing. (ex: favicon, robots.txt, etc.)
- `/tests` - Folder containing tests
  - `../components` - Contains tests for frontend components
  - `../resource` - Contains resource files used in testing.
- `/docs` - Folder containing documentation related to the project. No code should be here unless it's for the sake of documentation
  - `24-25` - Folder containing documentation from the 2024-2025 team of Asset Atlas
- `/docker` - Folder containing Docker stuff
  - `secrets.env` - This is a .env village that holds secrets necessary for user to log in. You can either go to the pinned messages in #general in discord to find our current local dev secrets, or configure your own in a manner similar to the doc in the .github/assetatlas folder

## Troubleshooting

- Restart docker engine

- Delete docker images and containers (sometimes cache issues)

- Can take like ~3 minutes to build containers with no cache on Rose laptops

- Delete repo and clone again from github

- Restart PC

- Run VS code/docker as administrator
