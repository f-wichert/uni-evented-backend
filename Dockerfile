FROM node:18-slim

WORKDIR /app
COPY ./package*.json ./
RUN npm ci

COPY . ./
RUN npm run tsc

RUN mkdir ./media
VOLUME /app/media

CMD ["npm", "run", "start"]
