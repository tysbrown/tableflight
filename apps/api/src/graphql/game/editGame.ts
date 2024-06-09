import type { Game } from "@/types"
import { GraphQLError } from "graphql"
import type { Context } from "~/context"

export default {
  Mutation: {
    editGame: async (
      _: never,
      { id, name, description }: Partial<Game>,
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

      const game = await prisma.game.update({
        where: {
          id: Number(id),
        },
        data: {
          name,
          description,
        },
      })
      return game
    },
  },
}
