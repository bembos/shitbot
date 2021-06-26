/*
  Warnings:

  - You are about to drop the column `locked_liquidity` on the `general_constraints` table. All the data in the column will be lost.
  - Added the required column `time_based` to the `general_constraints` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `general_constraints` DROP COLUMN `locked_liquidity`,
    ADD COLUMN `max_liq_tok_in_address` INTEGER,
    ADD COLUMN `max_tok_in_address` INTEGER,
    ADD COLUMN `min_number_of_holders` INTEGER,
    ADD COLUMN `min_number_of_trans` INTEGER,
    ADD COLUMN `time_based` BOOLEAN NOT NULL,
    ADD COLUMN `time_for_checks` INTEGER,
    MODIFY `owner_renounced` BOOLEAN;

-- CreateTable
CREATE TABLE `tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `address` VARCHAR(191) NOT NULL,
    `transactions` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pairs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `address` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `liquidity_holders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `address` VARCHAR(191) NOT NULL,
    `percentage` DOUBLE NOT NULL,
    `pair_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `token_holders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `address` VARCHAR(191) NOT NULL,
    `percentage` DOUBLE NOT NULL,
    `token_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `liquidity_holders` ADD FOREIGN KEY (`pair_id`) REFERENCES `pairs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `token_holders` ADD FOREIGN KEY (`token_id`) REFERENCES `tokens`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
