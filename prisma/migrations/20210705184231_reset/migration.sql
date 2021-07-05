/*
  Warnings:

  - Added the required column `max_time` to the `buy_orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `buy_orders` ADD COLUMN `max_time` INTEGER NOT NULL;
