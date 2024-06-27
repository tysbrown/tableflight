# TableFlight (In Development)

A modern, web-based VTT with AI integrations.

### Stack Info
* Frontend: Vite, React, TypeScript, Tailwind (Twin Macro), URQL
* Backend: Node, Express, TypeScript, GraphQL, Drizzle
* Infrastructure: Kubernetes + Helm, AWS EKS, EC2, RDS, S3, Docker

The frontend is a Single Page App, the backend is a system of Node + GraphQL microservices and PostgreSQL databases.

### Local Dev

Copy the contents of .env.template into a new .env and fill in the variables.

You have two options:
1. Do the usual process of installing dependencies and running the app with NX via `npm run dev` from the root directory.
2. Spin up a dev container. The codebase is fully containerized and can be ran as a dev container in VSCode, or with `docker-compose up` from the root directory. You'll need to install Docker on your computer if you don't already have it.
