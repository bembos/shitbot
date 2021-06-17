-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191),

    UNIQUE INDEX `User.email_unique`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blockchains` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,
    `abbrevation` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `buy_order_statuses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `buy_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191),
    `address` VARCHAR(191) NOT NULL,
    `slippage` INTEGER NOT NULL,
    `amount_given` DOUBLE NOT NULL,
    `auto_multiplier` DOUBLE,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed_at` DATETIME(3),
    `user_id` INTEGER NOT NULL,
    `blockchain_id` INTEGER NOT NULL,
    `buy_order_status_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bots` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `enabled` BOOLEAN NOT NULL,
    `initial_amount` DOUBLE NOT NULL,
    `auto_multiplier` DOUBLE NOT NULL,
    `max_transaction` INTEGER NOT NULL,
    `max_time` INTEGER NOT NULL,
    `wallet` VARCHAR(191) NOT NULL,
    `slippage` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `blockchain_id` INTEGER,

    UNIQUE INDEX `bots_user_id_unique`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trade_windows` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token_address` VARCHAR(191) NOT NULL,
    `token_name` VARCHAR(191) NOT NULL,
    `bot_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaction_statuses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `log_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `trade_window_id` INTEGER NOT NULL,

    UNIQUE INDEX `log_messages.trade_window_id_unique`(`trade_window_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token_given` VARCHAR(191),
    `given_amount` DOUBLE,
    `token_received` VARCHAR(191),
    `received_amount` DOUBLE,
    `transaction_status_id` INTEGER NOT NULL,
    `trade_window_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_contract_code_cons` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,
    `desc` VARCHAR(191),
    `source_code` LONGTEXT NOT NULL,
    `avoid` BOOLEAN NOT NULL,
    `contract_code_constraint_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `buy_orders` ADD FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `buy_orders` ADD FOREIGN KEY (`blockchain_id`) REFERENCES `blockchains`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `buy_orders` ADD FOREIGN KEY (`buy_order_status_id`) REFERENCES `buy_order_statuses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bots` ADD FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bots` ADD FOREIGN KEY (`blockchain_id`) REFERENCES `blockchains`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trade_windows` ADD FOREIGN KEY (`bot_id`) REFERENCES `bots`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `log_messages` ADD FOREIGN KEY (`trade_window_id`) REFERENCES `trade_windows`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD FOREIGN KEY (`transaction_status_id`) REFERENCES `transaction_statuses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD FOREIGN KEY (`trade_window_id`) REFERENCES `trade_windows`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
