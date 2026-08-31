-- DropForeignKey (grupos_permissoes só tinha dados de teste desta sessão, sem uso em produção)
ALTER TABLE `grupos_permissoes` DROP FOREIGN KEY `grupos_permissoes_grupo_id_fkey`;
ALTER TABLE `grupos_permissoes` DROP FOREIGN KEY `grupos_permissoes_permissao_id_fkey`;

-- DropTable
DROP TABLE `grupos_permissoes`;

-- CreateTable
CREATE TABLE `grupos_permissoes` (
    `id` VARCHAR(191) NOT NULL,
    `grupo_id` VARCHAR(191) NOT NULL,
    `papel` ENUM('ADM', 'TEC', 'USR') NOT NULL,
    `permissao_id` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `grupos_permissoes_grupo_id_idx`(`grupo_id`),
    INDEX `grupos_permissoes_permissao_id_idx`(`permissao_id`),
    UNIQUE INDEX `grupos_permissoes_grupo_id_papel_permissao_id_key`(`grupo_id`, `papel`, `permissao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `grupos_permissoes` ADD CONSTRAINT `grupos_permissoes_grupo_id_fkey` FOREIGN KEY (`grupo_id`) REFERENCES `grupos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupos_permissoes` ADD CONSTRAINT `grupos_permissoes_permissao_id_fkey` FOREIGN KEY (`permissao_id`) REFERENCES `permissoes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
