/*
  Warnings:

  - You are about to drop the column `wallet` on the `bots` table. All the data in the column will be lost.
  - Added the required column `wallet_address` to the `bots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wallet_private` to the `bots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `locked_liquidity` to the `general_constraints` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `bots` DROP COLUMN `wallet`,
    ADD COLUMN `wallet_address` VARCHAR(191) NOT NULL,
    ADD COLUMN `wallet_private` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `general_constraints` ADD COLUMN `locked_liquidity` BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE `trade_windows` ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `finishedAt` DATETIME(3);
