-- Align DB with Prisma schema: a user can have many orders.
-- Previous migration `20251126021741_video_125` incorrectly added a unique index on orders.userId.

DROP INDEX `orders_userId_key` ON `orders`;
