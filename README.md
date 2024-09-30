# TableFlight (In Development)

An open-source, web-based VTT with AI integrations.

### Stack Info

- Frontend: TypeScript, Vite, React, Tailwind (Twin Macro), URQL
- Backend: TypeScript, Node, Express, GraphQL, Drizzle, Postgres
- Infrastructure: Kubernetes + Helm, AWS EKS, EC2, RDS, S3, Docker

The frontend is a Single Page App, the backend is a system of Node services that communicate in-process via function calls. As the project grows, we will likely move to a microservices architecture with a message queue.

### Services

- common - Shared types, interfaces, and utilities
- auth - Authentication and authorization
- games - CRUD operations for games
- game-session - Websocket connection for game session
- characters - CRUD operations for characters
- ai-tools - AI tools for game
- chat - Chat functionality
- notifications - Notification system
- video - Video streaming
- payments - Payment processing
- analytics - Analytics tracking

### Local Dev

1. Copy the contents of .env.template into a new .env and fill in the variables.
2. Run `npm i` in the root directory to install dependencies.
3. Run `npm run dev` in the root directory to start both the UI and API.
