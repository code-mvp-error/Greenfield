import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Disable query logging in dev to save memory
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
