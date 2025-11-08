# Svelte 5 Upgrade Recap

We have updated the project from Svelte 4 up to Svelte 5. This required some massive changes to the codebase, detailed below.

## Project Layout

We previously used the svelte-routing library, along with Express to handle routing. Since svelte-routing is not available for Svelte 5, we have opted to move to SvelteKit as our backend instead. SvelteKit uses a [filesystem-based router](https://svelte.dev/docs/kit/routing), where routes are defined by files and directories in the `src/routes/` directory.
To define a route, a `+server.ts`, `+page.ts` and/or a `+page.svelte` file is created in a directory, and the directories translate to a URI. So `src/routes/view/[id]/server.ts` contains the code related to the route `localhost:3000/view/[id]`, where `[id]` (or any term in square brackets []) is a required parameter.

- `+server.ts` should contain code that runs on the server. This is mostly used for API routes in our project.
- `+page.svelte` is for frontend code. It is used when accessing a route should retrieve a page to display to the user.
- `+page.ts` is used to load data before our page is rendered. It exports a `load()` function that runs before the page is rendered. This is useful if some information needs to be retrieved before rendering, like getting the item to render from the database.
- There is also a `+layout.svelte` file in `src/routes/`. This file defines a layout common to all pages. So if you define a `<div>` in that file, that `<div>` will appear on every page.

**Most code that was previously in `/src/routes/` and `/src/sontrollers/` has been moved to one of these files.**

Most other files were moved somewhere within the `/src/lib` directory. These files can be imported easily with the `$lib` shortcut.

## Syntax Changes

Svelte 5 has introduced [runes](https://svelte.dev/docs/svelte/what-are-runes), and many old features now use some version of this feature. Fortunately, files can run in legacy mode which allows Svelte 4 syntax to still be valid. Rune mode and legacy mode are separate, which means a file can either use the old Svelte 4 syntax or the new rune system,**but not both**. File A can be in legacy mode while we update File B to runes. We cannot have File B use both legacy syntax and runes.

Our project is currently completely in legacy mode. Our goal should be to steadily update old files to the new rune syntax, which we can do on a file-by-file basis.

This change only applies to `.svelte` and `.svelte.ts` files. Any other file should be unaffected.

## Docker Setup

Our Docker configuration should be mostly the same as it was previously. The most notable difference is our change from node:20-bullseye to node:20-alpine. This version of node is under long-term support (LTS). This has changed a few lines in our Dockerfile, but has not affect any docker-compose files.

## Skeleton Updates

Our project previously used some components from Skeleton v2 as well as their themeing system. This version of Skeleton does not support Svelte 5. We are now using Skeleton v4. This means that some components (Most toggle sliders) may look slightly different both in code and in browser. The way our CSS is loaded into the project is also slightly different. The `customTheme.css` file defines a number of colors and spacings, which are then used in `src/lib/styles` to apply those stylings to specific elements.
