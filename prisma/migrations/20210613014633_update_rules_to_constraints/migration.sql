/*
  Warnings:

  - You are about to drop the `contract_content_rules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `contract_status_configurations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `liquidity_pool_configurations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rule_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_contract_content_confs` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `slippage` to the `bots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slippage` to the `buy_orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `contract_content_rules` DROP FOREIGN KEY `contract_content_rules_ibfk_1`;

-- DropForeignKey
ALTER TABLE `contract_status_configurations` DROP FOREIGN KEY `contract_status_configurations_ibfk_2`;

-- DropForeignKey
ALTER TABLE `contract_status_configurations` DROP FOREIGN KEY `contract_status_configurations_ibfk_1`;

-- DropForeignKey
ALTER TABLE `liquidity_pool_configurations` DROP FOREIGN KEY `liquidity_pool_configurations_ibfk_2`;

-- DropForeignKey
ALTER TABLE `liquidity_pool_configurations` DROP FOREIGN KEY `liquidity_pool_configurations_ibfk_1`;

-- DropForeignKey
ALTER TABLE `user_contract_content_confs` DROP FOREIGN KEY `user_contract_content_confs_ibfk_1`;

-- DropForeignKey
ALTER TABLE `user_contract_content_confs` DROP FOREIGN KEY `user_contract_content_confs_ibfk_2`;

-- AlterTable
ALTER TABLE `bots` ADD COLUMN `slippage` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `buy_orders` ADD COLUMN `slippage` INTEGER NOT NULL;

-- DropTable
DROP TABLE `contract_content_rules`;

-- DropTable
DROP TABLE `contract_status_configurations`;

-- DropTable
DROP TABLE `liquidity_pool_configurations`;

-- DropTable
DROP TABLE `rule_types`;

-- DropTable
DROP TABLE `user_contract_content_confs`;

-- CreateTable
CREATE TABLE `constraint_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `constraint_types.label_unique`(`label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `general_constraints` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `market_cap` BOOLEAN NOT NULL,
    `max_cap` BIGINT NOT NULL,
    `min_cap` BIGINT NOT NULL,
    `liquidity` BOOLEAN NOT NULL,
    `max_liq` BIGINT NOT NULL,
    `min_liq` BIGINT NOT NULL,
    `owner_renounced` BOOLEAN NOT NULL,
    `user_id` INTEGER NOT NULL,
    `constraint_type_id` INTEGER NOT NULL,

    UNIQUE INDEX `general_constraints.constraint_type_id_unique`(`constraint_type_id`),
    UNIQUE INDEX `general_constraints_user_id_unique`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contract_code_constraints` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,
    `desc` VARCHAR(191) NOT NULL,
    `constraint_type_id` INTEGER NOT NULL,

    UNIQUE INDEX `contract_code_constraints.label_unique`(`label`),
    UNIQUE INDEX `contract_code_constraints.constraint_type_id_unique`(`constraint_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_contract_code_cons` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,
    `source_code` LONGTEXT NOT NULL,
    `avoid` BOOLEAN NOT NULL,
    `contract_code_constraint_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,

    UNIQUE INDEX `user_contract_code_cons.contract_code_constraint_id_unique`(`contract_code_constraint_id`),
    UNIQUE INDEX `user_contract_code_cons.user_id_unique`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `general_constraints` ADD FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `general_constraints` ADD FOREIGN KEY (`constraint_type_id`) REFERENCES `constraint_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contract_code_constraints` ADD FOREIGN KEY (`constraint_type_id`) REFERENCES `constraint_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_contract_code_cons` ADD FOREIGN KEY (`contract_code_constraint_id`) REFERENCES `contract_code_constraints`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_contract_code_cons` ADD FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
