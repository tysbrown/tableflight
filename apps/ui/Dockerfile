# Stage 1: Build the app
FROM node:lts-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all the source files
COPY . .

# Build the app
RUN npx nx reset
RUN npm run ui:build:prod

# Stage 2: Serve the app
FROM nginx:alpine

COPY --from=builder /app/dist/apps/ui /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
