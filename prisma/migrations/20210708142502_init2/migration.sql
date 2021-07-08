/*
  Warnings:

  - A unique constraint covering the columns `[label]` on the table `buy_order_statuses` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE `buy_order_log_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` MEDIUMTEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `buy_order_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `buy_order_statuses.label_unique` ON `buy_order_statuses`(`label`);

-- AddForeignKey
ALTER TABLE `buy_order_log_messages` ADD FOREIGN KEY (`buy_order_id`) REFERENCES `buy_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
