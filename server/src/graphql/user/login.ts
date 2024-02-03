import type { User } from "@/types"
import type { Context } from "~/context"
import { compare } from "bcrypt"
import { GraphQLError } from "graphql"
import {
  createAccessToken,
  createRefreshToken,
  setRefreshTokenCookie,
} from "../../auth.js"

export default {
  Mutation: {
    login: async (
      _: never,
      { email, password }: Partial<User>,
      context: Context,
    ) => {
      const { res, prisma } = context

      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (!user)
        throw new GraphQLError("The username you entered does not exist", {
          extensions: {
            code: "BAD_USER_INPUT",
            httpStatus: 401,
          },
        })

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
    },
  },
}
