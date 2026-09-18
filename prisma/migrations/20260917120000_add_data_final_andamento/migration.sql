-- Campo novo, independente de `resposta`/status — data final do andamento,
-- preenchida manualmente pelo usuário.
ALTER TABLE `andamentos` ADD COLUMN `data_final` DATETIME(3) NULL;
