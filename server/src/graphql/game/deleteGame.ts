import type { Game } from "@/types"
import { GraphQLError } from "graphql"
import type { Context } from "~/context"

export default {
  Mutation: {
    deleteGame: (
      _: never,
      { id }: Partial<Game>,
      { user, prisma }: Context,
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

      const game = prisma.game.delete({
        where: {
          id: Number(id),
        },
      })
      return game
    },
  },
}
