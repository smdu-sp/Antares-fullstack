-- Cada processo passa a pertencer a um único grupo (cópias independentes por
-- grupo, mesmo numero_sei) em vez de N:N via processos_grupos. numero_sei deixa
-- de ser único no sistema inteiro e passa a ser único só dentro do mesmo grupo.

-- 1) Coluna nova, opcional por enquanto pra permitir backfill
ALTER TABLE `processos` ADD COLUMN `grupo_id` VARCHAR(191) NULL;

-- 2) Backfill: grupo_id = vínculo ativo mais antigo em processos_grupos
UPDATE `processos` p
SET p.`grupo_id` = (
  SELECT pg.`grupo_id`
  FROM `processos_grupos` pg
  WHERE pg.`processo_id` = p.`id` AND pg.`ativo` = 1
  ORDER BY pg.`criadoEm` ASC
  LIMIT 1
);

-- 3) Coluna obrigatória a partir daqui
ALTER TABLE `processos` MODIFY COLUMN `grupo_id` VARCHAR(191) NOT NULL;

-- 4) numero_sei único-no-sistema vira único-por-grupo
DROP INDEX `processos_numero_sei_key` ON `processos`;
CREATE UNIQUE INDEX `processos_numero_sei_grupo_id_key` ON `processos`(`numero_sei`, `grupo_id`);

-- 5) Índice + FK pra grupo_id
CREATE INDEX `processos_grupo_id_idx` ON `processos`(`grupo_id`);
ALTER TABLE `processos` ADD CONSTRAINT `processos_grupo_id_fkey` FOREIGN KEY (`grupo_id`) REFERENCES `grupos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6) Tabela de junção N:N não é mais necessária
DROP TABLE `processos_grupos`;
