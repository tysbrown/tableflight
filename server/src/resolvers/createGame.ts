import type { Game } from "@/types"
import type { Context } from "../context"

export const createGame = async (
  _: unknown,
  { name, description }: Partial<Game>,
  { prisma, user }: Context
) => {
  const game = await prisma.game.create({
    data: {
      name,
      description,
      createdBy: {
        connect: {
          id: user.id,
        },
      },
    },
  })
  return game
}
