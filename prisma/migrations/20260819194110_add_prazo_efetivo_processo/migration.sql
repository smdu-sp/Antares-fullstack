-- AlterTable
ALTER TABLE `processos` ADD COLUMN `andamentos_todos_concluidos` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `prazo_efetivo` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `processos_prazo_efetivo_idx` ON `processos`(`prazo_efetivo`);

-- CreateIndex
CREATE INDEX `processos_andamentos_todos_concluidos_idx` ON `processos`(`andamentos_todos_concluidos`);
