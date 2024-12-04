# Base image with necessary build tools
FROM node:20-bullseye AS base
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Cache dependencies
FROM base AS deps_cache
WORKDIR /usr/src/app
COPY package*.json ./

# Development dependencies and app setup
FROM deps_cache AS build_deps
WORKDIR /usr/src/app
COPY ./src ./src
COPY ["tsconfig.json", "vite.config.ts", "tailwind.config.ts", "rollup.config.js", "./"]
RUN npm ci

# Production dependencies only
FROM deps_cache AS prod_deps
WORKDIR /usr/src/app
# Install only production dependencies
RUN npm ci --omit=dev

# Build application
FROM build_deps AS builder
WORKDIR /usr/src/app
# Run the build step
RUN npm run build --verbose

# Final production image
FROM prod_deps AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
# Copy the built app from builder stage
COPY --from=builder /usr/src/app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
