FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app
RUN ls -al
COPY package.json ./ 
COPY package-lock.json* ./ 
#COPY npm-shrinkwrap.json* ./
RUN npm install --production --silent && mv node_modules ../
COPY . .
RUN npm run build
EXPOSE 3000
RUN chown -R node /usr/src/app
USER node
CMD ["node", "dist/index.js"]
