FROM node as dev
WORKDIR /app
COPY ./api/package.json .
COPY ./api/prisma ./prisma/
RUN npm i
COPY ./api .
COPY ./common/ /common
RUN npx prisma generate --data-proxy
EXPOSE 1337
CMD ["npm", "run", "dev"]

FROM node as prod-builder
WORKDIR /app
COPY --from=dev /app .
RUN npm run build

FROM nginx:alpine
COPY --from=prod-builder /app/dist /usr/share/nginx/html
EXPOSE 1337
CMD ["nginx", "-g", "daemon off;"]