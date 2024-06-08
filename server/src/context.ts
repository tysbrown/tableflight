import type { User } from "@/types"
import type { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"
import { withAccelerate } from "@prisma/extension-accelerate"

const prisma = new PrismaClient().$extends(withAccelerate()) as unknown

export interface Context {
  prisma: PrismaClient
  req?: Request
  res?: Response
  user?: User
}

export const context: Context = {
  prisma: prisma,
}
