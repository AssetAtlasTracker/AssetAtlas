FROM node:22-alpine AS base

# Same package.json and package-lock.json for both builder and runner
FROM base AS dep_files
WORKDIR /usr/src/app
COPY ["./package.json", "./pnpm-lock.yaml", "./"]
RUN npm install --global pnpm

# Only build node deps for builder when they have changed
FROM dep_files AS build_deps
WORKDIR /usr/src/app
RUN pnpm install --frozen-lockfile

# Only build node deps for production when they have changed
FROM dep_files AS prod_deps
WORKDIR /usr/src/app
RUN pnpm install --frozen-lockfile --prod

FROM build_deps AS builder
WORKDIR /usr/src/app
# Only copy specific files+folders intead of "COPY . ." to avoid copying host's node_modules and other unnessary files
COPY ["./src", "./src"]
# COPY ["./svelte-kit", "./svelte-kit"]
COPY [".npmrc", "postcss.config.js", "svelte.config.js", "tailwind.config.ts", "tsconfig.json", "vite.config.ts", "./"]
RUN pnpm build

FROM prod_deps AS runner
WORKDIR /usr/src/app
# why does this source path need to be fully qualified to work?
COPY --from=builder ["/usr/src/app/build", "./build"]
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["node", "./build/index.js"]
