The relevant info in this file should be transferred to an actual setup guide.
Delete this file as soon as that happens
This is what I did, not a new user setup guide (new users don't need to run the project generator)

Windows 10
Install docker desktop (version 27.3.1 right now)
Install nvm-windows (https://github.com/coreybutler/nvm-windows/)
Use it to install node 22.11.0 (`nvm install 22`, `nvm use 22`)
Install pnpm (`npm install -g pnpm`) (I have version 9.0.4)

https://svelte.dev/docs/kit/introduction

https://svelte.dev/docs/kit/creating-a-project
Ran project generator via `npx sv create`

```txt
PS C:\Git\AssetAtlasDeno> npx sv create
┌  Welcome to the Svelte CLI! (v0.6.1)
│
◇  Where would you like your project to be created?
│  ./
│
◇  Which template would you like?
│  SvelteKit minimal
│
◇  Add type checking with Typescript?
│  Yes, using Typescript syntax
│
◆  Project created
│
◇  What would you like to add to your project? (use arrow keys / space bar)
│  eslint, vitest, tailwindcss, storybook
│
◇  tailwindcss: Which plugins would you like to add?
│  typography, forms, container-queries, aspect-ratio
│
◇  Which package manager do you want to install dependencies with?
│  pnpm
```

Brought in docker files from old repo (don't work yet)

Configure for adapter-node https://svelte.dev/docs/kit/adapter-node `pnpm add --save-dev @sveltejs/adapter-node`

Update dockerfile with new paths and files from the project generator and using pnpm instead of npm

Test building container without launching it in a way that ensures all log output from the process is visible `docker build . -f .\docker\Dockerfile --progress=plain --no-cache`. seems like it can also be viewed in docker desktop Builds tab

Fix various errors that arose from the docker build with that info

Test regular docker build via `docker compose -f .\docker\docker-compose.yml up --build -d`

Test local dev via `pnpm dev`

Test storybook via `pnpm storybook` (have heard good things about it but not sure if you want to use it)
