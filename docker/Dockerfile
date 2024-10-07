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
FROM node:16-alpine as builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
COPY package*.json ./
RUN npm run build
FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY package.json ./
COPY package-lock.json ./
RUN npm install --production --silent
COPY --from=builder /usr/src/app/dist ./dist
# COPY --from=builder /usr/src/app/public ./public
# COPY . .
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]