-- CreateIndex
CREATE INDEX `andamentos_ativo_criadoEm_idx` ON `andamentos`(`ativo`, `criadoEm`);

-- CreateIndex
CREATE INDEX `andamentos_status_idx` ON `andamentos`(`status`);

-- CreateIndex
CREATE INDEX `andamentos_prazo_idx` ON `andamentos`(`prazo`);

-- CreateIndex
CREATE INDEX `andamentos_prorrogacao_idx` ON `andamentos`(`prorrogacao`);

-- CreateIndex
CREATE INDEX `andamentos_resposta_idx` ON `andamentos`(`resposta`);

-- CreateIndex
CREATE INDEX `andamentos_destino_idx` ON `andamentos`(`destino`);

-- CreateIndex
CREATE INDEX `processos_ativo_criadoEm_idx` ON `processos`(`ativo`, `criadoEm`);

-- CreateIndex
CREATE INDEX `processos_prazo_idx` ON `processos`(`prazo`);

-- CreateIndex
CREATE INDEX `processos_prorrogacao_idx` ON `processos`(`prorrogacao`);
