# TableFlight

The virtual tabletop we all want, with AI and Discord integration.

## Local Development

### You need a database
If you aren't part of the TableFlight dev team, you won't have access to our database. You can still run the app locally, but you'll need to set up your own database and paste in it's URL for the DATABASE_URL and DIRECT_URL environment variables. We use Postgres, but you can use whatever you want. Just make sure to change the configuration in `api/prisma/schema.prisma` based on the provider you choose.

Note that we use Prisma's database proxy. If you want to use it too:
* The DATABASE_URL environment variable is for the endpoint to Prisma's proxy. 
* The DIRECT_URL environment variable is for the endpoint to your database.

If you don't want to use Prisma's database proxy:
* The DATABASE_URL environment variable is for the endpoint to your database.
* You don't need the DIRECT_URL environment variable.
* You'll also need to remove the `directUrl = env("DIRECT_URL")` line from `api/prisma/schema.prisma`.

Once you have plugged in your database strings...

1. If you don't already have it, [download Docker.](https://docs.docker.com/get-docker/)
2. Run `npm i` in both /api and /ui directories.
3. Run `docker-compose up` in the root directory.