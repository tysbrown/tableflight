import { createSchema, createYoga } from "graphql-yoga"
import { mergeResolvers, mergeTypeDefs } from "@graphql-tools/merge"
import { loadFilesSync } from "@graphql-tools/load-files"
import express, { Request, Response } from "express"
import path from "path"
import cors from "cors"
import bodyParser from "body-parser"
import { context } from "./context.js"
import {
  createAccessToken,
  createRefreshToken,
  getUser,
  setRefreshTokenCookie,
} from "./auth.js"
import pkg, { JwtPayload } from "jsonwebtoken"
import cookieParser from "cookie-parser"
import { InitialContext } from "@/types"
const { verify } = pkg

const resolversPath = path.join(__dirname, "./resolvers")
const typeDefsPath = path.join(__dirname, "./typeDefs")

const resolvers = loadFilesSync(resolversPath, { extensions: ["js"] })
const typeDefs = loadFilesSync(typeDefsPath, { extensions: ["gql"] })

const createContext = (req: Request, res: Response) => {
  const { authorization } = req.headers

  if (authorization) {
    const token = authorization.split(" ")[1]
    const payload = verify(token, process.env.ACCESS_TOKEN_SECRET) as JwtPayload
    const user = getUser(context, payload.userId)
    return { ...context, req, res, user }
  }

  return { ...context, req, res }
}

const yoga = createYoga({
  schema: createSchema({
    typeDefs: mergeTypeDefs(typeDefs),
    resolvers: mergeResolvers(resolvers),
  }),
  context: ({ req, res }: InitialContext) => createContext(req, res),
})

const handleRefreshToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.jid

  if (!refreshToken) return res.send({ ok: false, accessToken: "" })

  const payload = verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
  ) as JwtPayload

  const user = await getUser(context, payload.userId)

  if (!user || user.tokenVersion !== payload.tokenVersion)
    return res.send({ ok: false, accessToken: "" })

  setRefreshTokenCookie(res, createRefreshToken(user))

  return res.send({ ok: true, accessToken: createAccessToken(user), user })
}

const app = express()

app.use(cookieParser())
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://localhost:5173",
      "https://sandbox.embed.apollographql.com",
    ],
    credentials: true,
  }),
)
app.use(bodyParser.json())
app.use(yoga.graphqlEndpoint, yoga)

app.post("/refresh_token", handleRefreshToken)

app.listen(1337, () => {
  console.log("✨ Server is running on http://localhost:1337/graphql")
})
