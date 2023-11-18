import type { Context } from "~/context"
import { GraphQLError } from "graphql"

export default {
  Query: {
    games: (_: never, __: never, context: Context) => {
      const { prisma, user } = context || {}

      if (!user)
        throw new GraphQLError("You are not authorized to make this request.", {
          extensions: {
            code: "UNAUTHORIZED",
            http: {
              status: 401,
            },
          },
        })

      return prisma.game.findMany({
        orderBy: {
          updatedAt: "desc",
        },
      })
    },
  },
}
