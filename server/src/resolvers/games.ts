import type { Context } from "../context"

export const games = (_: never, __: never, context: Context) => {
  return context.prisma.game.findMany({
    orderBy: {
      updatedAt: "desc",
    },
  })
}
