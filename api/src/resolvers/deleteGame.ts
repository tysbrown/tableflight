import type { Game } from "@/common/types"
import type { Context } from "../context"

export const deleteGame = (
  _: unknown,
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
