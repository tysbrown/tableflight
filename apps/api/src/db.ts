import { PrismaClient } from '@prisma/client'
import { context } from './context'

/**
 * Client for blob-heavy models (Asset bytes, GridState snapshots).
 *
 * The default client routes through Prisma Accelerate, whose proxy caps
 * responses at 5MB (P6009) — a map image or snapshot can exceed that.
 * DIRECT_URL talks straight to Postgres with no such cap. Small relational
 * queries stay on the accelerated client; only blobs come here.
 */
export const blobPrisma: PrismaClient = process.env.DIRECT_URL
  ? new PrismaClient({ datasourceUrl: process.env.DIRECT_URL })
  : (context.prisma as PrismaClient)
