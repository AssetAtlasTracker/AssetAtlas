FROM node:20-bullseye AS build

# Install OS dependencies
RUN apt-get update && apt-get install -y python3 make g++ iputils-ping && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Copy only package.json + package-lock.json to install dependencies first
COPY package*.json ./

# Install all (dev+prod) dependencies
RUN npm ci

COPY . .

# Build
RUN npm run build

# Debug: show what's in dist/ after the build
RUN echo "DEBUG: Listing dist folder..." && ls -l dist

FROM node:20-bullseye AS production

# Install OS dependencies
RUN apt-get update && apt-get install -y python3 make g++ iputils-ping && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy package.json + lock to install only prod dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy over the dist folder from the build stage
COPY --from=build /usr/src/app/dist ./dist

# Switch to non-root user
USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]

