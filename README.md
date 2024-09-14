# TableFlight (In Development)

A modern, web-based VTT with AI integrations.

### Stack Info

- Frontend: TypeScript, Vite, React, Tailwind (Twin Macro), URQL
- Backend: TypeScript, Node, Express, GraphQL, Drizzle, Postgres
- Infrastructure: Kubernetes + Helm, AWS EKS, EC2, RDS, S3, Docker

The frontend is a React SPA, the backend is a system of Node + GraphQL microservices.

### Local Dev

1. Copy the contents of .env.template into a new .env and fill in the variables.
2. Run `npm i` in the root directory to install dependencies.
3. Run `npm run dev` in the root directory to start the frontend and backend servers.
