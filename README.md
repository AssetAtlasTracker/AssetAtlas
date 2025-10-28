# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```


## MongoDB & Mongoose

This project uses MongoDB and mongoose for database access. The `docker-compose.yml` includes a `mongo` service for local development and SSR.

To use MongoDB in your code:

```ts
import { connectMongo } from '$lib/mongo';
await connectMongo();
```

The default connection string is set via the `MONGO_URI` environment variable in compose:
`mongodb://root:example@mongo:27017/?authSource=admin`

## Docker

This project includes a Dockerfile and a `docker-compose.yml` to run the app in a container.


Production build (SSR, multi-stage):

Build the image:

```powershell
docker build -t assetatlas-svelte5:latest .
```

Run the container (runs SvelteKit SSR Node server on port 3000):

```powershell
docker run --rm -p 3000:3000 assetatlas-svelte5:latest
```

Development (live-reload with host bind):

Using docker-compose you'll get a development container that mounts the project and exposes Vite's dev server on port 5173:

```powershell
docker-compose up --build dev
```

Notes:

- The Dockerfile now runs SvelteKit SSR using Node (port 3000).
- If your adapter uses a different entrypoint, update the Dockerfile CMD accordingly.
- For static builds, use the previous Dockerfile and expose port 4173.

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
