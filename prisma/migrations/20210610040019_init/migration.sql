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
    `address` VARCHAR(191) NOT NULL,
    `amount_given` DOUBLE NOT NULL,
    `auto_multiplier` DOUBLE,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed_at` DATETIME(3),
    `user_id` INTEGER NOT NULL,
    `blockchain_id` INTEGER NOT NULL,
    `buy_order_status_id` INTEGER NOT NULL,

    UNIQUE INDEX `buy_orders.user_id_unique`(`user_id`),
    UNIQUE INDEX `buy_orders.blockchain_id_unique`(`blockchain_id`),
    UNIQUE INDEX `buy_orders.buy_order_status_id_unique`(`buy_order_status_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bots` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `enabled` BOOLEAN NOT NULL,
    `auto_multiplier` DOUBLE NOT NULL,
    `max_transaction` INTEGER NOT NULL,
    `max_time` DOUBLE NOT NULL,
    `user_id` INTEGER NOT NULL,
    `blockchain_id` INTEGER NOT NULL,

    UNIQUE INDEX `bots.blockchain_id_unique`(`blockchain_id`),
    UNIQUE INDEX `bots_user_id_unique`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trade_windows` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token_address` VARCHAR(191) NOT NULL,
    `token_name` DOUBLE NOT NULL,
    `bot_id` INTEGER NOT NULL,

    UNIQUE INDEX `trade_windows.bot_id_unique`(`bot_id`),
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
    `trade_window_id` INTEGER NOT NULL,

    UNIQUE INDEX `transactions.trade_window_id_unique`(`trade_window_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rule_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `rule_types.label_unique`(`label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `liquidity_pool_rules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,
    `desc` VARCHAR(191) NOT NULL,
    `rule_type_id` INTEGER NOT NULL,

    UNIQUE INDEX `liquidity_pool_rules.label_unique`(`label`),
    UNIQUE INDEX `liquidity_pool_rules.rule_type_id_unique`(`rule_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_liq_pool_confs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `enabled` BOOLEAN NOT NULL,
    `liquidity_pool_rule_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,

    UNIQUE INDEX `user_liq_pool_confs.liquidity_pool_rule_id_unique`(`liquidity_pool_rule_id`),
    UNIQUE INDEX `user_liq_pool_confs.user_id_unique`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contract_status_rules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,
    `desc` VARCHAR(191) NOT NULL,
    `rule_type_id` INTEGER NOT NULL,

    UNIQUE INDEX `contract_status_rules.label_unique`(`label`),
    UNIQUE INDEX `contract_status_rules.rule_type_id_unique`(`rule_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_contract_status_confs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `enabled` BOOLEAN NOT NULL,
    `contract_status_rule_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,

    UNIQUE INDEX `user_contract_status_confs.contract_status_rule_id_unique`(`contract_status_rule_id`),
    UNIQUE INDEX `user_contract_status_confs.user_id_unique`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contract_content_rules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,
    `desc` VARCHAR(191) NOT NULL,
    `rule_type_id` INTEGER NOT NULL,

    UNIQUE INDEX `contract_content_rules.label_unique`(`label`),
    UNIQUE INDEX `contract_content_rules.rule_type_id_unique`(`rule_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_contract_content_confs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,
    `source_code` LONGTEXT NOT NULL,
    `avoid` BOOLEAN NOT NULL,
    `enabled` BOOLEAN NOT NULL,
    `contract_content_rule_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,

    UNIQUE INDEX `user_contract_content_confs.contract_content_rule_id_unique`(`contract_content_rule_id`),
    UNIQUE INDEX `user_contract_content_confs.user_id_unique`(`user_id`),
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
ALTER TABLE `bots` ADD FOREIGN KEY (`blockchain_id`) REFERENCES `blockchains`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trade_windows` ADD FOREIGN KEY (`bot_id`) REFERENCES `bots`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `log_messages` ADD FOREIGN KEY (`trade_window_id`) REFERENCES `trade_windows`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD FOREIGN KEY (`trade_window_id`) REFERENCES `trade_windows`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `liquidity_pool_rules` ADD FOREIGN KEY (`rule_type_id`) REFERENCES `rule_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_liq_pool_confs` ADD FOREIGN KEY (`liquidity_pool_rule_id`) REFERENCES `liquidity_pool_rules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_liq_pool_confs` ADD FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contract_status_rules` ADD FOREIGN KEY (`rule_type_id`) REFERENCES `rule_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_contract_status_confs` ADD FOREIGN KEY (`contract_status_rule_id`) REFERENCES `contract_status_rules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_contract_status_confs` ADD FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contract_content_rules` ADD FOREIGN KEY (`rule_type_id`) REFERENCES `rule_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_contract_content_confs` ADD FOREIGN KEY (`contract_content_rule_id`) REFERENCES `contract_content_rules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_contract_content_confs` ADD FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
