-- CreateTable
CREATE TABLE `origens_processo` (
    `id` VARCHAR(191) NOT NULL,
    `valor` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `origens_processo_valor_key`(`valor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `interessados` (
    `id` VARCHAR(191) NOT NULL,
    `valor` VARCHAR(768) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `interessados_valor_key`(`valor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unidades` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `sigla` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `unidades_nome_key`(`nome`),
    UNIQUE INDEX `unidades_sigla_key`(`sigla`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `nomeSocial` VARCHAR(191) NULL,
    `login` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `dev` BOOLEAN NOT NULL DEFAULT false,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `versao_sessao` INTEGER NOT NULL DEFAULT 1,
    `avatar` VARCHAR(191) NULL,
    `unidade_id` VARCHAR(191) NOT NULL,
    `ultimoLogin` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `usuarios_login_key`(`login`),
    UNIQUE INDEX `usuarios_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `processos` (
    `id` VARCHAR(191) NOT NULL,
    `numero_sei` VARCHAR(191) NOT NULL,
    `assunto` TEXT NOT NULL,
    `origem` VARCHAR(191) NOT NULL DEFAULT 'EXPEDIENTE',
    `interessado_id` VARCHAR(191) NULL,
    `unidade_remetente_id` VARCHAR(191) NULL,
    `unidade_destino_id` VARCHAR(191) NULL,
    `prazo` DATETIME(3) NULL,
    `prorrogacao` DATETIME(3) NULL,
    `data_recebimento` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `data_envio_unidade` DATETIME(3) NULL,
    `data_resposta_final` DATETIME(3) NULL,
    `resposta_final` VARCHAR(191) NULL,
    `unidade_respondida_id` VARCHAR(191) NULL,
    `usuario_atribuido_id` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `unidade_id` VARCHAR(191) NOT NULL,
    `grupo_id` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `prazo_efetivo` DATETIME(3) NULL,
    `andamentos_todos_concluidos` BOOLEAN NOT NULL DEFAULT false,

    INDEX `processos_prazo_efetivo_idx`(`prazo_efetivo`),
    INDEX `processos_andamentos_todos_concluidos_idx`(`andamentos_todos_concluidos`),
    INDEX `processos_ativo_criadoEm_idx`(`ativo`, `criadoEm`),
    INDEX `processos_prazo_idx`(`prazo`),
    INDEX `processos_prorrogacao_idx`(`prorrogacao`),
    INDEX `processos_grupo_id_idx`(`grupo_id`),
    UNIQUE INDEX `processos_numero_sei_grupo_id_key`(`numero_sei`, `grupo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `andamentos` (
    `id` VARCHAR(191) NOT NULL,
    `origem` VARCHAR(191) NOT NULL,
    `destino` VARCHAR(191) NOT NULL,
    `data_envio` DATETIME(3) NULL,
    `prazo` DATETIME(3) NULL,
    `prorrogacao` DATETIME(3) NULL,
    `resposta` DATETIME(3) NULL,
    `status` ENUM('EM_ANDAMENTO', 'CONCLUIDO', 'PRORROGADO') NOT NULL DEFAULT 'EM_ANDAMENTO',
    `observacao` VARCHAR(191) NULL,
    `assunto` TEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processo_id` VARCHAR(191) NOT NULL,
    `usuario_id` VARCHAR(191) NOT NULL,
    `usuario_prorrogacao_id` VARCHAR(191) NULL,

    INDEX `andamentos_ativo_criadoEm_idx`(`ativo`, `criadoEm`),
    INDEX `andamentos_status_idx`(`status`),
    INDEX `andamentos_prazo_idx`(`prazo`),
    INDEX `andamentos_prorrogacao_idx`(`prorrogacao`),
    INDEX `andamentos_resposta_idx`(`resposta`),
    INDEX `andamentos_destino_idx`(`destino`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `logs` (
    `id` VARCHAR(191) NOT NULL,
    `tipoAcao` ENUM('PROCESSO_CRIADO', 'PROCESSO_ATUALIZADO', 'PROCESSO_REMOVIDO', 'ANDAMENTO_CRIADO', 'ANDAMENTO_ATUALIZADO', 'ANDAMENTO_PRORROGADO', 'ANDAMENTO_CONCLUIDO', 'ANDAMENTO_REMOVIDO', 'USUARIO_PERMISSAO_ATUALIZADA', 'GRUPO_ATUALIZADO', 'PROCESSO_GRUPO_ATUALIZADO') NOT NULL,
    `descricao` LONGTEXT NOT NULL,
    `entidadeTipo` VARCHAR(191) NOT NULL,
    `entidadeId` VARCHAR(191) NOT NULL,
    `dadosAntigos` LONGTEXT NULL,
    `dadosNovos` LONGTEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuario_id` VARCHAR(191) NOT NULL,

    INDEX `logs_usuario_id_idx`(`usuario_id`),
    INDEX `logs_entidadeTipo_entidadeId_idx`(`entidadeTipo`, `entidadeId`),
    INDEX `logs_tipoAcao_idx`(`tipoAcao`),
    INDEX `logs_criadoEm_idx`(`criadoEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grupos` (
    `id` VARCHAR(191) NOT NULL,
    `codigo` ENUM('EXPEDIENTE', 'SERVIN', 'GABINETE', 'GLOBAL', 'OUTORGA') NOT NULL DEFAULT 'EXPEDIENTE',
    `nome` VARCHAR(191) NOT NULL,
    `tipo` ENUM('COORDENADORIA', 'DIVISAO') NOT NULL DEFAULT 'COORDENADORIA',
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `grupos_codigo_idx`(`codigo`),
    INDEX `grupos_tipo_idx`(`tipo`),
    UNIQUE INDEX `grupos_codigo_tipo_key`(`codigo`, `tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios_grupos` (
    `id` VARCHAR(191) NOT NULL,
    `usuario_id` VARCHAR(191) NOT NULL,
    `grupo_id` VARCHAR(191) NOT NULL,
    `permissao_grupo` ENUM('ADM', 'TEC', 'USR') NOT NULL DEFAULT 'USR',
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `usuarios_grupos_usuario_id_idx`(`usuario_id`),
    INDEX `usuarios_grupos_grupo_id_idx`(`grupo_id`),
    UNIQUE INDEX `usuarios_grupos_usuario_id_grupo_id_key`(`usuario_id`, `grupo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios_grupos_permissoes` (
    `id` VARCHAR(191) NOT NULL,
    `usuario_grupo_id` VARCHAR(191) NOT NULL,
    `visualizar_proprios` BOOLEAN NOT NULL DEFAULT false,
    `visualizar_grupo` BOOLEAN NOT NULL DEFAULT false,
    `modificar_proprios` BOOLEAN NOT NULL DEFAULT false,
    `modificar_grupo` BOOLEAN NOT NULL DEFAULT false,
    `excluir` BOOLEAN NOT NULL DEFAULT false,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `usuarios_grupos_permissoes_usuario_grupo_id_key`(`usuario_grupo_id`),
    INDEX `usuarios_grupos_permissoes_usuario_grupo_id_idx`(`usuario_grupo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissoes` (
    `id` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `permissoes_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `usuarios_permissoes` (
    `id` VARCHAR(191) NOT NULL,
    `usuario_id` VARCHAR(191) NOT NULL,
    `grupo_id` VARCHAR(191) NULL,
    `permissao_id` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `usuarios_permissoes_usuario_id_idx`(`usuario_id`),
    INDEX `usuarios_permissoes_grupo_id_idx`(`grupo_id`),
    INDEX `usuarios_permissoes_permissao_id_idx`(`permissao_id`),
    UNIQUE INDEX `usuarios_permissoes_usuario_id_grupo_id_permissao_id_key`(`usuario_id`, `grupo_id`, `permissao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `preferencias_usuario` (
    `id` VARCHAR(191) NOT NULL,
    `chave` VARCHAR(191) NOT NULL,
    `valor` TEXT NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuario_id` VARCHAR(191) NOT NULL,

    INDEX `preferencias_usuario_usuario_id_idx`(`usuario_id`),
    UNIQUE INDEX `preferencias_usuario_usuario_id_chave_key`(`usuario_id`, `chave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_unidade_id_fkey` FOREIGN KEY (`unidade_id`) REFERENCES `unidades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `processos` ADD CONSTRAINT `processos_interessado_id_fkey` FOREIGN KEY (`interessado_id`) REFERENCES `interessados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `processos` ADD CONSTRAINT `processos_unidade_remetente_id_fkey` FOREIGN KEY (`unidade_remetente_id`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `processos` ADD CONSTRAINT `processos_unidade_destino_id_fkey` FOREIGN KEY (`unidade_destino_id`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `processos` ADD CONSTRAINT `processos_usuario_atribuido_id_fkey` FOREIGN KEY (`usuario_atribuido_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `processos` ADD CONSTRAINT `processos_unidade_id_fkey` FOREIGN KEY (`unidade_id`) REFERENCES `unidades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `processos` ADD CONSTRAINT `processos_grupo_id_fkey` FOREIGN KEY (`grupo_id`) REFERENCES `grupos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `andamentos` ADD CONSTRAINT `andamentos_processo_id_fkey` FOREIGN KEY (`processo_id`) REFERENCES `processos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `andamentos` ADD CONSTRAINT `andamentos_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `andamentos` ADD CONSTRAINT `andamentos_usuario_prorrogacao_id_fkey` FOREIGN KEY (`usuario_prorrogacao_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios_grupos` ADD CONSTRAINT `usuarios_grupos_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios_grupos` ADD CONSTRAINT `usuarios_grupos_grupo_id_fkey` FOREIGN KEY (`grupo_id`) REFERENCES `grupos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios_grupos_permissoes` ADD CONSTRAINT `usuarios_grupos_permissoes_usuario_grupo_id_fkey` FOREIGN KEY (`usuario_grupo_id`) REFERENCES `usuarios_grupos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupos_permissoes` ADD CONSTRAINT `grupos_permissoes_grupo_id_fkey` FOREIGN KEY (`grupo_id`) REFERENCES `grupos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupos_permissoes` ADD CONSTRAINT `grupos_permissoes_permissao_id_fkey` FOREIGN KEY (`permissao_id`) REFERENCES `permissoes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios_permissoes` ADD CONSTRAINT `usuarios_permissoes_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios_permissoes` ADD CONSTRAINT `usuarios_permissoes_grupo_id_fkey` FOREIGN KEY (`grupo_id`) REFERENCES `grupos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios_permissoes` ADD CONSTRAINT `usuarios_permissoes_permissao_id_fkey` FOREIGN KEY (`permissao_id`) REFERENCES `permissoes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `preferencias_usuario` ADD CONSTRAINT `preferencias_usuario_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
