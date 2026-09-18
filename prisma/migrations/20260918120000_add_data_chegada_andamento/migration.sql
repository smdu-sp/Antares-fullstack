-- Campo novo, independente de `data_envio`/`resposta`/status — data de chegada
-- do processo ao destino, preenchida manualmente pelo usuário.
ALTER TABLE `andamentos` ADD COLUMN `data_chegada` DATETIME(3) NULL;
