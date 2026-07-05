import type { Context, InitialContext } from '~common'
import express, { type Request, type RequestHandler } from 'express'
import { type IResolvers } from '@graphql-tools/utils'
import { YogaSchemaDefinition, createSchema, createYoga } from 'graphql-yoga'
import cors from 'cors'
import bodyParser from 'body-parser'
import { generateContext } from './context'
import cookieParser from 'cookie-parser'
import { resolvers, typeDefs } from './graphql'
import { serveAsset } from './assets'

const app = express()
const apiRouter = express.Router()

const generateSchema = (): YogaSchemaDefinition<unknown, InitialContext> =>
  createSchema({
    typeDefs,
    resolvers: resolvers as IResolvers<unknown, Context>,
  })

const yoga = createYoga({
  schema: generateSchema(),
  context: ({ req }: { req: Request }) => generateContext(req),
})

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://sandbox.embed.apollographql.com',
      'https://stage.tableflight.com',
      'https://tableflight.com',
    ],
    credentials: true,
  }),
)
app.use(cookieParser())
// Board snapshots embed map images as data URLs until dedicated asset
// storage lands, so saveGridState payloads run well past the 100kb default.
app.use(bodyParser.json({ limit: '50mb' }))

apiRouter.get('/assets/:id', serveAsset as RequestHandler)
apiRouter.use(yoga.graphqlEndpoint, yoga as RequestHandler)

app.use('/api', apiRouter)

app.listen(1337, () => {
  if (process.env.NODE_ENV === 'dev') {
    const icon = '\x1b[32m➜\x1b[0m'
    console.log(`  ${icon}  UI: http://localhost:5137`)
    console.log(`  ${icon}  GraphiQL: http://localhost:1337/api/graphql`)
    console.log(`  ${icon}  Prisma Studio: http://localhost:5555`)
  }
})

export default app
