import { YogaSchemaDefinition, createSchema, createYoga } from 'graphql-yoga'
import express, { Request, RequestHandler, Response } from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { context } from './context'
import {
  createAccessToken,
  createRefreshToken,
  getUser,
  setRefreshTokenCookie,
} from './auth'
import pkg, { JwtPayload } from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import type { Context, InitialContext } from '~common'
import { resolvers, typeDefs } from './graphql'
import { IResolvers } from '@graphql-tools/utils'
import { stat } from 'fs'
const { verify } = pkg

const app = express()
const apiRouter = express.Router()

const generateSchema = (): YogaSchemaDefinition<unknown, InitialContext> =>
  createSchema({
    typeDefs,
    resolvers: resolvers as IResolvers<unknown, Context>,
  })

const generateContext = (req: Request): InitialContext => {
  const { authorization } = req.headers

  if (authorization) {
    const token = authorization.split(' ')[1]

    if (!token) throw new Error('Token not found!')

    if (!process.env.ACCESS_TOKEN_SECRET)
      throw new Error('Token secret not found!')

    const payload = verify(token, process.env.ACCESS_TOKEN_SECRET) as JwtPayload
    const user = getUser(context, payload.userId)

    if (!user) throw new Error('Failed to find user!')

    return { ...context, user } as InitialContext
  }

  return { ...context } as InitialContext
}

const yoga = createYoga({
  schema: generateSchema(),
  context: ({ req }: { req: Request }) => generateContext(req),
})

const handleRefreshToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.jid

  if (!refreshToken) return res.send({ ok: false, accessToken: '' })
  if (!process.env.REFRESH_TOKEN_SECRET)
    throw new Error('Refresh token secret not found!')

  try {
    const payload = verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    ) as JwtPayload

    const user = await getUser(context, payload.userId)

    if (!user || user.tokenVersion !== payload.tokenVersion)
      return res.send({ ok: false, accessToken: '' })

    setRefreshTokenCookie(res, createRefreshToken(user))

    return res.send({ ok: true, accessToken: createAccessToken(user), user })
  } catch (err) {
    console.error(err)
    return res.send({ ok: false, accessToken: '' })
  }
}

// app.use(
//   cors({
//     origin: [
//       'http://localhost:5173',
//       'https://sandbox.embed.apollographql.com',
//       'https://stage.tableflight.com',
//       'https://tableflight.com',
//     ],
//     credentials: true,
//   }),
// )
app.use(cors())
app.use(cookieParser())
app.use(bodyParser.json())

apiRouter.use(yoga.graphqlEndpoint, yoga as RequestHandler)
apiRouter.post('/refresh_token', handleRefreshToken)
apiRouter.use('/health-check', (_req, res) => res.send({ message: 'Hello world' }))

app.use('/api', apiRouter)

app.listen(1337, () => {
  serverMessage([
    '✨ http://localhost:5173                     UI',
    '✨ http://localhost:1337/api/graphql   GraphiQL',
    '✨ http://localhost:5555          Prisma Studio',
  ])
})

const serverMessage = (messages: string[]) => {
  const maxLength = Math.max(...messages.map((msg) => msg.length))
  const topBorder = `┌${'─'.repeat(maxLength + 3)}┐`
  const bottomBorder = `└${'─'.repeat(maxLength + 3)}┘`

  console.log(topBorder)

  messages.forEach((msg: string) => {
    console.log(`│ ${msg} │`)
  })

  console.log(bottomBorder)
}
