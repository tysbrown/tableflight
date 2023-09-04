import type { User } from "@/types"
import { compare } from "bcrypt"
import { GraphQLError } from "graphql"
import {
  createAccessToken,
  createRefreshToken,
  setRefreshTokenCookie,
} from "../auth.js"
import { Context } from "../context.js"

export const login = async (
  _: unknown,
  { email, password }: Partial<User>,
  context: Context
) => {
  const { res, prisma } = context

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  })

  if (!user) {
    throw new GraphQLError("The username you entered does not exist", {
      extensions: {
        code: "BAD_USER_INPUT",
        http: 401,
      },
    })
  }

  const isMatch = await compare(password, user?.password)

  const refreshToken = createRefreshToken(user)

  if (isMatch) {
    setRefreshTokenCookie(res, refreshToken)

    return {
      accessToken: createAccessToken(user),
      user,
    }
  } else {
    throw new Error("Incorrect password")
  }
}