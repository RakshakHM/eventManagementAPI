-- AlterTable
ALTER TABLE `User` ADD COLUMN `emailConfirmToken` VARCHAR(191) NULL,
    ADD COLUMN `emailConfirmed` BOOLEAN NOT NULL DEFAULT false;
