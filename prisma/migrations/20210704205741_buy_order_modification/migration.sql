/*
  Warnings:

  - Added the required column `pair_address` to the `buy_orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `buy_orders` ADD COLUMN `pair_address` VARCHAR(191) NOT NULL;
