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
FROM node:lts as builder
WORKDIR /usr/src/app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json package-lock.json ./
RUN MONGOMS_DISABLE_POSTINSTALL=true npm ci --ignore-scripts --verbose
COPY . .
#COPY package*.json ./
RUN npm run build --verbose
RUN npm prune --production
FROM node:lts-slim
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]