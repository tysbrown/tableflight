import type { User } from '~common';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { DefaultArgs } from '@prisma/client/runtime/library';

const prisma = new PrismaClient().$extends(
  withAccelerate()
) as unknown as PrismaClient<unknown, never, DefaultArgs>;

export type Context = {
  req: Request;
  res: Response;
  prisma?: PrismaClient;
  user?: User;
}

export const context: Context = {
  prisma: prisma,
  req: {} as Request,
  res: {} as Response,
};
