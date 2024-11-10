FROM node:20-alpine AS base

# Same package.json and package-lock.json for both builder and runner
FROM base AS dep_files
WORKDIR /usr/src/app
COPY package*.json ./

# Only build node deps for builder when they have changed
FROM dep_files AS build_deps
WORKDIR /usr/src/app
RUN npm ci

# Only build node deps for production when they have changed
FROM dep_files AS prod_deps
WORKDIR /usr/src/app
RUN npm ci --omit=dev



FROM build_deps AS builder
WORKDIR /usr/src/app
# Only copy specific files+folders intead of "COPY . ." to avoid copying host's node_modules and other unnessary files
COPY ./src ./src
COPY ["tsconfig.json", "vite.config.ts", "tailwind.config.ts", "rollup.config.js", "./"]
RUN npm run build --verbose

FROM prod_deps AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=builder /usr/src/app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
