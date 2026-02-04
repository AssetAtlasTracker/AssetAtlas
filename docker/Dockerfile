FROM node:22-alpine AS build

# Install OS dependencies
RUN apk add --no-cache python3 make g++ iputils

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install dependencies
RUN npm ci --silent || npm install --silent

# Copy source files
COPY . .

# Build the app
RUN npm run build

FROM node:22-alpine AS production

# Install OS dependencies for Alpine
RUN apk add --no-cache python3 make g++ iputils

WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm ci --omit=dev --silent || npm install --omit=dev --silent

# Copy built output from builder stage (SvelteKit outputs to 'build' not 'dist')
COPY --from=build /usr/src/app/build ./build
COPY --from=build /usr/src/app/static ./static
COPY --from=build /usr/src/app/package.json ./package.json
COPY --from=build /usr/src/app/docker/migrate-mongo-docker-config.cjs ./
COPY --from=build /usr/src/app/docker/migrations ./migrations

# Create uploads directory with proper permissions
RUN mkdir -p /usr/src/app/uploads && chown -R node:node /usr/src/app/uploads

USER node

EXPOSE 3000

CMD ["node", "build/index.js"]