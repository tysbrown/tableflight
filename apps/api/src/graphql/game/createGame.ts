import type { Game } from "@/types"
import { GraphQLError } from "graphql"
import type { Context } from "~/context"

export default {
  Mutation: {
    createGame: async (
      _: never,
      { name, description }: Partial<Game>,
      { prisma, user }: Context,
    ) => {
      if (!user)
        throw new GraphQLError("You are not authorized to make this request.", {
          extensions: {
            code: "UNAUTHORIZED",
            http: {
              status: 401,
            },
          },
        })

      const game = await prisma.game.create({
        data: {
          name,
          description,
          createdById: user.id,
        },
      })
      return game
    },
  },
}
