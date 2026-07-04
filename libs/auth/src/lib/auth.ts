import type { Context, User } from '~common'
import type { Response } from 'express'
import { sign, verify, type JwtPayload } from 'jsonwebtoken'

const isProd = process.env.NODE_ENV === 'prod'

export const createAccessToken = (user: User) => {
  if (!process.env.ACCESS_TOKEN_SECRET)
    throw new Error('Access token secret not found!')

  return sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '1h',
  })
}

export const createRefreshToken = (user: User) => {
  if (!process.env.REFRESH_TOKEN_SECRET)
    throw new Error('Refresh token secret not found!')

  return sign(
    { userId: user.id, tokenVersion: user.tokenVersion },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: '7d',
    },
  )
}

export const getUser = async ({ prisma }: Partial<Context>, userId: number) => {
  const user = await prisma?.user.findUnique({
    where: {
      id: userId,
    },
  })

  return user
}

export const setRefreshTokenCookie = async (res: Response, token: string) => {
  try {
    res.cookie('jid', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      domain: isProd ? 'tableflight.com' : 'localhost',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
  } catch (err) {
    console.error('Error setting refresh token cookie: ', err)
  }
}

export const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie('jid', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    domain: isProd ? 'tableflight.com' : 'localhost',
  })
}

export const refreshToken = async (_: never, __: never, context: Context) => {
  const { req, res } = context
  const token = req.cookies.jid

  if (!token) return { ok: false, accessToken: '' }
  if (!process.env.REFRESH_TOKEN_SECRET)
    throw new Error('Refresh token secret not found!')

  try {
    const payload = verify(
      token,
      process.env.REFRESH_TOKEN_SECRET,
    ) as JwtPayload

    const user = await getUser(context, payload.userId)

    if (!user || user.tokenVersion !== payload.tokenVersion)
      return { ok: false, accessToken: '' }

    setRefreshTokenCookie(res, createRefreshToken(user))

    return { ok: true, accessToken: createAccessToken(user), user }
  } catch (err) {
    console.error(err)
    return { ok: false, accessToken: '' }
  }
}
