import type { User } from "@/common/types"
import type { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export interface Context {
  prisma: PrismaClient
  req?: Request
  res?: Response
  user?: User
}

export const context: Context = {
  prisma: prisma,
}
