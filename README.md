# TableFlight (In Development)

A modern, web-based VTT with AI integrations.

### Stack Info

- Frontend: Vite, React, TypeScript, Tailwind (Twin Macro), URQL
- Backend: Node, Express, TypeScript, GraphQL, Drizzle
- Infrastructure: Kubernetes + Helm, AWS EKS, EC2, RDS, S3, Docker

The frontend is a Single Page App, the backend is a system of Node + GraphQL microservices and PostgreSQL databases.

### Local Dev

1. Copy the contents of .env.template into a new .env and fill in the variables.
2. Run `npm i` in the root directory to install dependencies.
3. Run `npm run dev` in the root directory to start the frontend and backend servers.
