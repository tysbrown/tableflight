import type { Game } from "@/types"
import type { Context } from "../context"

export const deleteGame = (
  _: never,
  { id }: Partial<Game>,
  context: Context
) => {
  const game = context.prisma.game.delete({
    where: {
      id: Number(id),
    },
  })
  return game
}
