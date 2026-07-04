import type { Context, InitialContext } from '~common'
import { type Request } from 'express'
import pkg, { type JwtPayload } from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { getUser } from 'auth'
const { verify } = pkg

const prisma = new PrismaClient().$extends(
  withAccelerate(),
) as unknown as PrismaClient

export const context: Partial<Context> = {
  prisma: prisma,
}

export const generateContext = async (
  req: Request,
): Promise<InitialContext> => {
  const { authorization } = req.headers

  if (authorization) {
    const token = authorization.split(' ')[1]

    if (!token) throw new Error('Token not found!')

    if (!process.env.ACCESS_TOKEN_SECRET)
      throw new Error('Token secret not found!')

    const payload = verify(token, process.env.ACCESS_TOKEN_SECRET) as JwtPayload
    const user = await getUser(context, payload.userId)

    if (!user) throw new Error('Failed to find user!')

    return { ...context, user } as InitialContext
  }

  return { ...context } as InitialContext
}
