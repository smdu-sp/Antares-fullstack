-- CreateTable
CREATE TABLE `origens_processo` (
    `id` VARCHAR(191) NOT NULL,
    `valor` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `origens_processo_valor_key`(`valor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
