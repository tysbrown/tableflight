import type { User } from "@/types"
import type { Context } from "~/context"

export default {
  Mutation: {
    revokeRefreshTokens: async (
      _: never,
      { id }: Partial<User>,
      context: Context,
    ) => {
      await context.prisma.user.update({
        where: {
          id: Number(id),
        },
        data: {
          tokenVersion: {
            increment: 1,
          },
        },
      })
      return true
    },
  },
}
