# TableFlight

The virtual tabletop we all want, with AI and Discord integration.

## Local Development

### You need a database

If you aren't part of the TableFlight dev team, you won't have access to our database. You can still run the app locally, but you'll need to set up your own database and paste in it's URL for the DATABASE_URL and DIRECT_URL environment variables. We use Postgres, but you can use whatever you want. Just make sure to change the configuration in `api/prisma/schema.prisma` based on the provider you choose.

[Prisma Docs - Connect your database](https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases/connect-your-database-typescript-postgresql)

Note that we use [Prisma's database proxy.](https://cloud.prisma.io/) If you want to use it too:

- The DATABASE_URL environment variable is for the endpoint to Prisma's proxy.
- The DIRECT_URL environment variable is for the endpoint to your database.

If you don't want to use Prisma's database proxy:

- The DATABASE_URL environment variable is for the endpoint to your database.
- You don't need the DIRECT_URL environment variable.
- You'll also need to remove the `directUrl = env("DIRECT_URL")` line from `api/prisma/schema.prisma`.

### Start the development servers

1. Fill in the environment variables in /server and /ui. Remove `.template` from the filenames.
2. From the root directory, run `npm i` to install dependencies for both /server and /ui.
3. From the root directory, run `npm run dev` to start the development servers.
 - UI: http://localhost:5173
 - Server: http://localhost:1337
4. (Optional) If you're using your own databse, you'll also need to run `npm run prisma:migrate:dev` from the root directory.
