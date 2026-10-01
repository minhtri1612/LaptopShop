import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  prismaReplica: PrismaClient;
};

function withPool(url: string) {
  if (url.includes("connection_limit=")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}connection_limit=20`;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : [],
  });

export const prismaPrimary = prisma;

export const prismaReplica =
  globalForPrisma.prismaReplica ||
  (process.env.DATABASE_REPLICA_URL
    ? new PrismaClient({
        datasourceUrl: withPool(process.env.DATABASE_REPLICA_URL),
      })
    : prisma);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaReplica = prismaReplica;
}
