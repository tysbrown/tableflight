import { PrismaClient } from '@prisma/client'
import { Context } from '~common'

const prisma = new PrismaClient()

export const context: Partial<Context> = {
  prisma: prisma,
}
