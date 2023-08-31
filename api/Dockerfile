FROM node as dev
WORKDIR /app
COPY package.json .
COPY prisma ./prisma/
RUN npm i
COPY . .
RUN npx prisma generate --data-proxy
EXPOSE 1337
CMD ["npm", "run", "dev"]