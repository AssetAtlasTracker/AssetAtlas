FROM node:22-alpine AS build

ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION

# Install OS dependencies
RUN apk add --no-cache python3 make g++ iputils

# Set working directory
WORKDIR /usr/src/app

# Copy lockfiles first for better cache utilization
COPY package*.json ./

# Install all dependencies (dev+prod) for build
RUN npm ci --silent || npm install --silent

# Copy source and build
COPY . .
RUN npm run build

FROM node:22-alpine AS production

# Install runtime OS dependencies
RUN apk add --no-cache python3 make g++ iputils

WORKDIR /usr/src/app
ENV NODE_ENV=production

# Install only production deps
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm ci --omit=dev --silent || npm install --omit=dev --silent
RUN npm install migrate-mongo --no-audit --no-fund --silent || true

# Copy built artifacts from build stage
COPY --from=build /usr/src/app/build ./build
COPY --from=build /usr/src/app/static ./static
COPY --from=build /usr/src/app/package.json ./package.json
COPY --from=build /usr/src/app/docker/migrate-mongo-docker-config.cjs ./
COPY --from=build /usr/src/app/docker/migrations ./migrations

# Copy entrypoint (keeps existing script name)
COPY docker/entrypoint-ghcr.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Ensure node user has ownership of the app directory and uploads
RUN mkdir -p /usr/src/app/uploads && chown -R node:node /usr/src/app

# Run as non-root
USER node

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "build/index.js"]