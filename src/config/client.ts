import { PrismaClient } from "@prisma/client";
import { readReplicas } from "@prisma/extension-read-replicas";

const replicaUrl = process.env.DATABASE_REPLICA_URL || process.env.DATABASE_URL;

if (!replicaUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const readUrl = replicaUrl;

function createPrisma(primary: PrismaClient) {
  return primary.$extends(
    readReplicas({
      url: readUrl,
    })
  );
}

const globalForPrisma = global as unknown as {
  prismaPrimary: PrismaClient;
  prisma: ReturnType<typeof createPrisma>;
};

export const prismaPrimary =
  globalForPrisma.prismaPrimary ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : [],
  });

export const prisma = globalForPrisma.prisma || createPrisma(prismaPrimary);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaPrimary = prismaPrimary;
  globalForPrisma.prisma = prisma;
}
