import type { Context, User } from '~common'

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
