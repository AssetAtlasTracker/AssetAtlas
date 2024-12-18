FROM node:20-bullseye AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY ./src ./src
COPY ./index.html ./
COPY ./tsconfig.json ./tsconfig.json
COPY ./tsconfig.server.json ./tsconfig.server.json
COPY ./tailwind.config.ts ./tailwind.config.ts
COPY ./vite.config.ts ./vite.config.ts
COPY ./postcss.config.js ./postcss.config.js

# Build frontend (CSS + Vite)
RUN npm run build:css && npm run build

# Build backend (server)
RUN npm run build:server

FROM node:20-bullseye AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy built frontend and server files
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/build-server ./build-server
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "build-server/index.js"]
