import type { Context } from '~common'
import { JwtPayload, verify } from 'jsonwebtoken'
import { createAccessToken, getUser, setRefreshTokenCookie } from '~api/auth'

export default {
  Mutation: {
    refreshToken: async (_: never, __: never, context: Context) => {
      const { req, res } = context
      const token = req?.cookies.jid

      if (!token) throw new Error('No refresh token found.')
      if (!process.env.REFRESH_TOKEN_SECRET)
        throw new Error('No refresh token secret found.')

      const { userId, tokenVersion } = verify(
        token,
        process.env.REFRESH_TOKEN_SECRET,
      ) as JwtPayload

      const user = await getUser(context, userId)

      if (!user) throw new Error('No user found.')

      if (user.tokenVersion !== Number(tokenVersion)) {
        throw new Error('Invalid refresh token.')
      }

      const newToken = createAccessToken(user)

      setRefreshTokenCookie(res, newToken)

      return {
        accessToken: newToken,
        user,
      }
    },
  },
}
