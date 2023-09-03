import type { Game } from "@/common/types"
import type { Context } from "../context"

export const editGame = async (
  _: unknown,
  { id, name, description }: Partial<Game>,
  context: Context
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
}
