# Development stage
FROM node:lts as dev
WORKDIR /app/api
COPY ./api .
COPY ./types.d.ts ../types.d.ts
RUN npm install
EXPOSE 1337
CMD ["npm", "run", "dev"]


# Production build stage
FROM node:lts as prod-builder
WORKDIR /app
COPY --from=dev /app .
RUN npm run build

# Nginx serving stage
FROM nginx:alpine
COPY --from=prod-builder /app/dist /usr/share/nginx/html
EXPOSE 1337
CMD ["nginx", "-g", "daemon off;"]

