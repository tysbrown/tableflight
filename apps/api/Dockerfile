FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx nx reset
RUN npm run api:build:prod
RUN npm run api:prisma:generate:prod

EXPOSE 1337

CMD ["node", "dist/apps/api/main.js"]
