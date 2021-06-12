/*
  Warnings:

  - You are about to drop the `contract_status_rules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `liquidity_pool_rules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_contract_status_confs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_liq_pool_confs` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `wallet` to the `bots` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `contract_status_rules` DROP FOREIGN KEY `contract_status_rules_ibfk_1`;

-- DropForeignKey
ALTER TABLE `liquidity_pool_rules` DROP FOREIGN KEY `liquidity_pool_rules_ibfk_1`;

-- DropForeignKey
ALTER TABLE `user_contract_status_confs` DROP FOREIGN KEY `user_contract_status_confs_ibfk_1`;

-- DropForeignKey
ALTER TABLE `user_contract_status_confs` DROP FOREIGN KEY `user_contract_status_confs_ibfk_2`;

-- DropForeignKey
ALTER TABLE `user_liq_pool_confs` DROP FOREIGN KEY `user_liq_pool_confs_ibfk_1`;

-- DropForeignKey
ALTER TABLE `user_liq_pool_confs` DROP FOREIGN KEY `user_liq_pool_confs_ibfk_2`;

-- AlterTable
ALTER TABLE `bots` ADD COLUMN `wallet` VARCHAR(191) NOT NULL,
    MODIFY `max_time` INTEGER NOT NULL;

-- DropTable
DROP TABLE `contract_status_rules`;

-- DropTable
DROP TABLE `liquidity_pool_rules`;

-- DropTable
DROP TABLE `user_contract_status_confs`;

-- DropTable
DROP TABLE `user_liq_pool_confs`;

-- CreateTable
CREATE TABLE `liquidity_pool_configurations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,
    `desc` VARCHAR(191) NOT NULL,
    `market_cap` BOOLEAN NOT NULL,
    `max_cap` BIGINT NOT NULL,
    `min_cap` BIGINT NOT NULL,
    `liquidity` BOOLEAN NOT NULL,
    `max_liq` BIGINT NOT NULL,
    `min_liq` BIGINT NOT NULL,
    `user_id` INTEGER NOT NULL,
    `rule_type_id` INTEGER NOT NULL,

    UNIQUE INDEX `liquidity_pool_configurations.label_unique`(`label`),
    UNIQUE INDEX `liquidity_pool_configurations.rule_type_id_unique`(`rule_type_id`),
    UNIQUE INDEX `liquidity_pool_configurations_user_id_unique`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contract_status_configurations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,
    `desc` VARCHAR(191) NOT NULL,
    `owner_renounced` BOOLEAN NOT NULL,
    `user_id` INTEGER NOT NULL,
    `rule_type_id` INTEGER NOT NULL,

    UNIQUE INDEX `contract_status_configurations.label_unique`(`label`),
    UNIQUE INDEX `contract_status_configurations.rule_type_id_unique`(`rule_type_id`),
    UNIQUE INDEX `contract_status_configurations_user_id_unique`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `liquidity_pool_configurations` ADD FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `liquidity_pool_configurations` ADD FOREIGN KEY (`rule_type_id`) REFERENCES `rule_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contract_status_configurations` ADD FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contract_status_configurations` ADD FOREIGN KEY (`rule_type_id`) REFERENCES `rule_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
