FROM node:lts as dev
WORKDIR /app
COPY ./ui/package.json .
RUN npm i
COPY ./ui .
COPY ./types.d.ts ./types.d.ts
EXPOSE 5173
CMD ["npm", "run", "dev"]

FROM node as prod-builder
WORKDIR /app
COPY --from=dev /app .
RUN npm run build

FROM nginx:alpine
COPY --from=prod-builder /app/dist /usr/share/nginx/html
EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]