-- Align DB with Prisma schema: a user can have many orders.
-- Previous migration `20251126021741_video_125` incorrectly added a unique index on orders.userId.
-- That unique index is also the one backing orders_userId_fkey, so MySQL
-- refuses to drop it (error 1553) until another index exists on userId.

ALTER TABLE `orders`
  ADD INDEX `orders_userId_idx` (`userId`),
  DROP INDEX `orders_userId_key`;
