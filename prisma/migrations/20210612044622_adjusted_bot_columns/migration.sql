/*
  Warnings:

  - Added the required column `initial_amount` to the `bots` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `bots` ADD COLUMN `initial_amount` DOUBLE NOT NULL,
    MODIFY `blockchain_id` INTEGER;
