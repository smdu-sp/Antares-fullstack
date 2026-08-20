-- CreateTable
CREATE TABLE `logs` (
    `id` VARCHAR(191) NOT NULL,
    `tipoAcao` ENUM('PROCESSO_CRIADO', 'PROCESSO_ATUALIZADO', 'PROCESSO_REMOVIDO', 'ANDAMENTO_CRIADO', 'ANDAMENTO_ATUALIZADO', 'ANDAMENTO_PRORROGADO', 'ANDAMENTO_CONCLUIDO', 'ANDAMENTO_REMOVIDO') NOT NULL,
    `descricao` TEXT NOT NULL,
    `entidadeTipo` VARCHAR(191) NOT NULL,
    `entidadeId` VARCHAR(191) NOT NULL,
    `dadosAntigos` TEXT NULL,
    `dadosNovos` TEXT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuario_id` VARCHAR(191) NOT NULL,

    INDEX `logs_usuario_id_idx`(`usuario_id`),
    INDEX `logs_entidadeTipo_entidadeId_idx`(`entidadeTipo`, `entidadeId`),
    INDEX `logs_tipoAcao_idx`(`tipoAcao`),
    INDEX `logs_criadoEm_idx`(`criadoEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
