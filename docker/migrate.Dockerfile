# .docker/migrate.Dockerfile
FROM node:20

# Set working directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install migrate-mongo dotenv --no-save

RUN pwd && ls -la

COPY migrate-mongo-docker-config.cjs .
COPY migrations ./migrations

CMD ["npx", "migrate-mongo", "up", "-f", "migrate-mongo-docker-config.cjs"]