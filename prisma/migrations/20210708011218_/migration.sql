/*
  Warnings:

  - You are about to drop the column `constraint_type_id` on the `contract_code_constraints` table. All the data in the column will be lost.
  - You are about to drop the column `constraint_type_id` on the `general_constraints` table. All the data in the column will be lost.
  - You are about to drop the `constraint_types` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `contract_code_constraints` DROP FOREIGN KEY `contract_code_constraints_ibfk_1`;

-- DropForeignKey
ALTER TABLE `general_constraints` DROP FOREIGN KEY `general_constraints_ibfk_2`;

-- AlterTable
ALTER TABLE `contract_code_constraints` DROP COLUMN `constraint_type_id`;

-- AlterTable
ALTER TABLE `general_constraints` DROP COLUMN `constraint_type_id`;

-- DropTable
DROP TABLE `constraint_types`;
