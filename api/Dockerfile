# Development stage
FROM node:lts as dev
WORKDIR /app
COPY ./api/package.json ./api/package-lock.json* ./
COPY ./api/prisma ./prisma/
RUN npm ci
COPY ./api .
COPY ./common/ /common
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
