# FROM node:16-alpine as builder
# WORKDIR /usr/src/app
# COPY package*.json ./
# RUN npm install
# COPY . .
# #frontend^ maybe
# FROM node:lts-alpine
# ENV NODE_ENV=production
# WORKDIR /usr/src/app
# RUN ls -al
# COPY package.json ./ 
# COPY package-lock.json* ./ 
# #COPY npm-shrinkwrap.json* ./
# RUN npm install --production --silent && mv node_modules ../
# COPY . .
# RUN npm run build
# EXPOSE 3000
# RUN chown -R node /usr/src/app
# USER node
# CMD ["node", "dist/index.js"]

FROM node:20-alpine AS base

FROM base AS build_deps
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci

FROM build_deps AS builder
WORKDIR /usr/src/app
# Only copy specific files intead of "COPY . ." to avoid copying host's node_modules and other unnessary files
COPY ./src ./src
COPY ["tsconfig.json", "vite.config.ts", "tailwind.config.ts", "rollup.config.js", "."]
RUN npm run build --verbose

FROM base AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /usr/src/app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
