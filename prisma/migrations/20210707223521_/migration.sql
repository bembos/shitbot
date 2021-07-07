/*
  Warnings:

  - Added the required column `gas_fees` to the `buy_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time_before_buy` to the `buy_orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `buy_orders` ADD COLUMN `gas_fees` INTEGER NOT NULL,
    ADD COLUMN `time_before_buy` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `buy_orders_configurations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slippage` INTEGER NOT NULL,
    `amount_given` DOUBLE NOT NULL,
    `auto_multiplier` DOUBLE,
    `max_time` INTEGER NOT NULL,
    `time_before_buy` INTEGER NOT NULL,
    `gas_fees` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,

    UNIQUE INDEX `buy_orders_configurations_user_id_unique`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `buy_orders_configurations` ADD FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
