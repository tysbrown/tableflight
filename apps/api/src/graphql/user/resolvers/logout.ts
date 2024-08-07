import type { Context } from '~common'
import { clearRefreshTokenCookie } from '~api/auth'

export default {
  Mutation: {
    logout: async (_: never, __: never, context: Context) => {
      const { res, prisma, user } = context

      if (!user) throw new Error('You are not logged in.')

      await prisma.user.update({
        where: { id: user.id },
        data: {
          tokenVersion: {
            increment: 1,
          },
        },
      })

      clearRefreshTokenCookie(res)

      return {
        message: 'Successfully logged out.',
      }
    },
  },
}
