import type { Context } from "../context"

export const games = (_: unknown, __: unknown, context: Context) => {
  return context.prisma.game.findMany({
    orderBy: {
      updatedAt: "desc",
    },
  })
}
