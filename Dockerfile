FROM node:18-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg \
 && rm -rf /var/lib/apt/lists/*


WORKDIR /app
COPY ./package*.json ./
RUN npm ci

COPY . ./
RUN npm run tsc

RUN mkdir ./media
VOLUME /app/media

CMD ["npm", "run", "start"]
