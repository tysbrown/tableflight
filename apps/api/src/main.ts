import { YogaSchemaDefinition, createSchema, createYoga } from 'graphql-yoga'
import { mergeResolvers } from '@graphql-tools/merge'
import { loadFilesSync } from '@graphql-tools/load-files'
import express, { Request, Response } from 'express'
import path from 'path'
import cors from 'cors'
import bodyParser from 'body-parser'
import { context } from './context.js'
import {
  createAccessToken,
  createRefreshToken,
  getUser,
  setRefreshTokenCookie,
} from './auth.js'
import pkg, { JwtPayload } from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import { typeDefs } from './graphql/typeDefs.js'
import type { InitialContext } from '~common'
const { verify } = pkg

const app = express()

const generateSchema = (): YogaSchemaDefinition<object, InitialContext> => {
  const modulesPath = path.join(__dirname, './graphql')
  const resolvers = loadFilesSync(modulesPath, { extensions: ['js'] })

  return createSchema({
    typeDefs,
    resolvers: mergeResolvers(resolvers),
  })
}

const createContext = (req: Request, res: Response): InitialContext => {
  const { authorization } = req.headers

  if (authorization) {
    const token = authorization.split(' ')[1]

    if (!token) throw new Error('Token not found!')

    if (!process.env.ACCESS_TOKEN_SECRET)
      throw new Error('Token secret not found!')

    const payload = verify(token, process.env.ACCESS_TOKEN_SECRET) as JwtPayload
    const user = getUser(context, payload.userId)

    if (!user) throw new Error('Failed to find user!')

    return { ...context, req, res, user } as InitialContext
  }

  return { ...context, req, res }
}

const yoga = createYoga({
  schema: generateSchema(),
  context: ({ req, res }: any) => createContext(req, res),
})

const handleRefreshToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.jid

  if (!refreshToken) return res.send({ ok: false, accessToken: '' })
  if (!process.env.REFRESH_TOKEN_SECRET)
    throw new Error('Refresh token secret not found!')

  try {
    const payload = verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
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

app.use(cookieParser())
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://localhost:5173',
      'https://sandbox.embed.apollographql.com',
    ],
    credentials: true,
  })
)
app.use(bodyParser.json())
app.use(yoga.graphqlEndpoint, yoga)

app.post('/refresh_token', handleRefreshToken)

app.listen(1337, () => {
  serverMessage([
    '✨ http://localhost:5173                     UI',
    '✨ http://localhost:1337/graphql       GraphiQL',
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
