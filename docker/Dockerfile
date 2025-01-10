# Base image with necessary build tools
FROM node:20-bullseye AS base
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Cache dependencies
FROM base AS deps_cache
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci

# Development dependencies and app setup
FROM deps_cache AS build_deps
WORKDIR /usr/src/app
COPY . .
RUN npm run build --verbose

# Production dependencies only
FROM deps_cache AS prod_deps
WORKDIR /usr/src/app
# Install only production dependencies
RUN npm ci --omit=dev

# Final production image
FROM prod_deps AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
# Copy the built app from build_deps stage
COPY --from=build_deps /usr/src/app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
