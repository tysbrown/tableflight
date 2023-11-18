import type { Game } from "@/types"
import type { Context } from "../context"

export default {
  Mutation: {
    editGame: async (
      _: never,
      { id, name, description }: Partial<Game>,
      context: Context,
    ) => {
      const game = await context.prisma.game.update({
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
