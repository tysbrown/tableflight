import type { Context, User } from '~common'
import type { Response } from 'express'
import pkg from 'jsonwebtoken'
const { sign } = pkg

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
  console.log('Setting refresh token cookie...')
  console.log('isProd: ', isProd)
  console.log('token: ', token)
  console.log('NODE_ENV: ', process.env.NODE_ENV)
  try {
    res.cookie('jid', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      domain: isProd ? '.stage.tableflight.com' : 'localhost',
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
    sameSite: 'none',
    domain: isProd ? 'tableflight.com' : 'localhost',
  })
}
