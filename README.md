# TableFlight

The virtual tabletop we all want, with AI and Discord integration.

Monorepo setup:
- UI: React + TypeScript + Vite + Tailwind + URQL
- Server: Node + Express + TypeScript + GraphQL Yoga + Prisma

## Local Development

### You need a database

If you're a visitor checking out the repo, you can run the project locally but will have to spin up your own database and plug in the connection string for the DATABASE_URL environment variable. I use Postgres, but you can use whatever relational database you want. Just make sure to change the configuration in `api/prisma/schema.prisma` based on the database you choose.

[Prisma Docs - Connect your database](https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases/connect-your-database-typescript-postgresql)

Note that the project's configured to use [Prisma Accelerate.](https://www.prisma.io/data-platform/accelerate) I don't imagine a visitor would want to subscribe to it, so you'll want to:

- Ensure your connection string is set to the DATABASE_URL env.
- You don't need the DIRECT_URL environment variable, remove it or leave it blank.
- Remove the `directUrl = env("DIRECT_URL")` line from `api/prisma/schema.prisma`.
- Remove the `withAccelerate` stuff from `server/src/context.ts`.

### Start the development servers

1. Fill in the environment variables in the root directory .env file. Remove `.template` from the filename.
2. From the root directory, run `npm i` to install dependencies for both /server and /ui.
3. From the root directory, run `npm run dev` to start the development servers.
   - UI: http://localhost:5173
   - Server: http://localhost:1337
4. You may also need to run `npm run prisma:migrate:dev` and/or `npm run prisma:generate` from the root directory.
5. You can spin up a local instance of Prisma Studio with `npm run prisma:studio`.
