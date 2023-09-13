import { ApolloServer } from "@apollo/server"
import { expressMiddleware } from "@apollo/server/express4"
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer"
import express from "express"
import http from "http"
import cors from "cors"
import bodyParser from "body-parser"
import { typeDefs, resolvers } from "./schema.js"
import { context } from "./context.js"
import {
  createAccessToken,
  createRefreshToken,
  getUser,
  setRefreshTokenCookie,
} from "./auth.js"
import pkg from "jsonwebtoken"
import cookieParser from "cookie-parser"
const { verify } = pkg

type ApolloServerContext = {
  token?: string
}

type Payload =
  | string
  | any
  | {
      userId: number
    }

const app = express()
const httpServer = http.createServer(app)

const server = new ApolloServer<ApolloServerContext>({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  // introspection: true,
})

await server.start()

app.use(cookieParser())

app.use(
  cors<cors.CorsRequest>({
    origin: [
      "http://localhost:5173",
      "https://localhost:5173",
      "https://sandbox.embed.apollographql.com",
    ],
    credentials: true,
  }),
)

app.use(
  "/graphql",
  bodyParser.json(),
  expressMiddleware(server, {
    context: async ({ req, res }) => {
      const { authorization } = req.headers

      if (authorization) {
        const token = authorization?.split(" ")[1]

        const payload: Payload = verify(token, process.env.ACCESS_TOKEN_SECRET)
        const { userId } = payload || {}
        const user = await getUser(context, userId)
        return {
          ...context,
          req,
          res,
          user,
        }
      }
      return {
        ...context,
        req,
        res,
      }
    },
  }),
)

app.post("/refresh_token", async (req, res) => {
  const token = req.cookies.jid

  if (!token) {
    return res.send({ ok: false, accessToken: "" })
  }

  const payload: Payload = verify(token, process.env.REFRESH_TOKEN_SECRET)
  const { userId } = payload || {}
  const user = await getUser(context, userId)

  if (!user) {
    return res.send({ ok: false, accessToken: "" })
  }

  if (user.tokenVersion !== payload.tokenVersion) {
    return res.send({ ok: false, accessToken: "" })
  }

  const refreshToken = createRefreshToken(user)
  setRefreshTokenCookie(res, refreshToken)
  const newToken = createAccessToken(user)

  return res.send({ ok: true, accessToken: newToken, user })
})

await new Promise<void>((resolve) => httpServer.listen({ port: 1337 }, resolve))

console.log("✨ UI ready at http://localhost:5173/")
console.log("✨ GraphQL Playground ready at http://localhost:1337/graphql")
