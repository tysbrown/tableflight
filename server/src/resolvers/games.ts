import { GraphQLError } from "graphql"
import type { Context } from "../context"

export const games = (_: never, __: never, context: Context) => {
  const { prisma, user } = context || {}

  if (!!user) {
    return prisma.game.findMany({
      orderBy: {
        updatedAt: "desc",
      },
    })
  }

  throw new GraphQLError("You are not authorized to make this request.", {
    extensions: {
      code: "UNAUTHORIZED",
      http: {
        status: 401,
      },
    },
  })
}
