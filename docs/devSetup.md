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
- Name PR's according to [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specifications

## Project Structure

- `/src` - Main project files. Most of your work will be here
  - `../controllers` - Contains code that will be executed when a route is accessed. Must be linked to a route through a routing file in the `../routes` directory
    - `../models` - Contains information on the code representation of database objects
    - `../routes` - Contains code related to routing. Essentially, code that says "when I go to 'example.com' this code should run"
    - `../stores` - Contains information on Stores, a feature from Svelte
    - `../svelteComponents` - Reusable components that can be included in other components or in pages
    - `../sveletePages` - Actual pages a user can access
    - `../svelteStyles` - CSS styling files for the pages and components
- `/tests` - Folder containing tests
- `/docs` - Folder containing documentation related to the project. No code should be here unless it's for the sake of documentation

## Troubleshooting

- Restart docker engine

- Delete docker images and containers (sometimes cache issues)

- Can take like ~3 minutes to build containers with no cache on Rose laptops

- Delete repo and clone again from github

- Restart PC

- Run VS code/docker as administrator
