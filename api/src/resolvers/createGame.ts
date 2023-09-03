import type { Game } from "@/common/types"
import type { Context } from "../context"

export const createGame = async (
  _: unknown,
  { name, description }: Partial<Game>,
  context: Context
) => {
  const game = await context.prisma.game.create({
    data: {
      name,
      description,
    },
  })
  return game
}
