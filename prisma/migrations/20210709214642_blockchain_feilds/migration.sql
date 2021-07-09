/*
  Warnings:

  - Added the required column `currency` to the `blockchains` table without a default value. This is not possible if the table is not empty.
  - Added the required column `decimals` to the `blockchains` table without a default value. This is not possible if the table is not empty.
  - Added the required column `router` to the `blockchains` table without a default value. This is not possible if the table is not empty.
  - Made the column `provider` on table `blockchains` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `blockchains` ADD COLUMN `currency` VARCHAR(191) NOT NULL,
    ADD COLUMN `decimals` INTEGER NOT NULL,
    ADD COLUMN `router` VARCHAR(191) NOT NULL,
    MODIFY `provider` VARCHAR(191) NOT NULL;
