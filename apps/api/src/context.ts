import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { DefaultArgs } from '@prisma/client/runtime/library'

const prisma = new PrismaClient().$extends(
  withAccelerate()
) as unknown as PrismaClient<any, never, DefaultArgs>

type Context = {
  prisma: PrismaClient
}

export const context: Context = {
  prisma: prisma,
}
