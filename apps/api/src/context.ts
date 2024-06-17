import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { Context } from '~common'

const prisma = new PrismaClient().$extends(
  withAccelerate(),
) as unknown as PrismaClient

export const context: Partial<Context> = {
  prisma: prisma,
}
