-- Unidades e interessados passam a ser por grupo (mesmo princípio de
-- processo.grupo_id): únicos POR GRUPO, não mais no sistema inteiro. O mesmo
-- nome/sigla/valor pode existir em grupos diferentes como cadastros
-- independentes.
--
-- `unidades` (tabela original) NÃO é tocada: fica intocada como catálogo
-- GLOBAL, servindo só `usuarios.unidade_id` e `processos.unidade_id` (o eco
-- automático da unidade de quem cadastrou o processo, nunca exibido/editado
-- na UI). Uma tabela nova, `unidades_grupo`, nasce só pra remetente/destino
-- de processo (os campos visíveis/editáveis na grid).
--
-- `interessados` só é usado em processo, então vira por-grupo na própria
-- tabela (ganha grupo_id), sem precisar de tabela nova.

-- ============================================================
-- 1. interessados: adicionar grupo_id + valor_hash (nullable pra popular)
-- ============================================================
ALTER TABLE `interessados` ADD COLUMN `grupo_id` VARCHAR(191) NULL;

-- valor_hash (SHA-256 de `valor`, hex) é quem carrega a unicidade por grupo,
-- não `valor` direto — ver comentário completo em schema.prisma no campo
-- `valorHash`: um índice único (valor, grupo_id) nos 768 chars inteiros de
-- `valor` estoura o limite de chave do InnoDB, e um prefixo mais curto não é
-- seguro (dado real já tem pares de interessados diferentes que só divergem
-- depois do char 191). Mantido pela aplicação daqui em diante.
-- SHA2(valor, 256) SEM nenhuma normalização (nem TRIM, nem LOWER) — tem que
-- bater exatamente com hashValorInteressado() (lib/server/interessados/
-- hash-valor.ts). De propósito: já tentamos TRIM e LOWER aqui e os dois
-- bateram de frente com dado real de produção — centenas de pares de
-- interessados só diferem por um espaço no início/fim ou por
-- maiúscula/minúscula e a collation do MySQL sempre tratou como DISTINTOS
-- (nunca foram deduplicados); normalizar no hash colapsava esses pares.
ALTER TABLE `interessados` ADD COLUMN `valor_hash` CHAR(64) NULL;
UPDATE `interessados` SET valor_hash = SHA2(valor, 256) WHERE valor_hash IS NULL;
ALTER TABLE `interessados` MODIFY COLUMN `valor_hash` CHAR(64) NOT NULL;

-- Backfill: cada interessado herda o grupo do processo MAIS ANTIGO que o
-- referencia (mesmo critério usado pra popular processo.grupo_id a partir de
-- ProcessoGrupo, na migração anterior).
UPDATE `interessados` i
JOIN (
  SELECT interessado_id, grupo_id
  FROM (
    SELECT interessado_id, grupo_id,
           ROW_NUMBER() OVER (PARTITION BY interessado_id ORDER BY criadoEm ASC) AS rn
    FROM `processos`
    WHERE interessado_id IS NOT NULL
  ) ranked
  WHERE rn = 1
) primeiro ON primeiro.interessado_id = i.id
SET i.grupo_id = primeiro.grupo_id;

-- Interessados nunca referenciados por nenhum processo (cadastros órfãos):
-- caem no grupo majoritário (EXPEDIENTE) em vez de ficar sem grupo.
UPDATE `interessados`
SET grupo_id = (SELECT id FROM `grupos` WHERE codigo = 'EXPEDIENTE' LIMIT 1)
WHERE grupo_id IS NULL;

ALTER TABLE `interessados` MODIFY COLUMN `grupo_id` VARCHAR(191) NOT NULL;

-- Índice único global antigo sai ANTES do fork abaixo (que insere de propósito
-- uma segunda linha com o mesmo `valor`, uma por grupo) — só depois entra o
-- composto por grupo.
DROP INDEX `interessados_valor_key` ON `interessados`;

-- Fork: interessado usado por processos de MAIS de um grupo — a linha
-- original fica com o grupo do processo mais antigo (já setado acima); pros
-- demais grupos, cria uma cópia própria (mesmo valor/ativo/criadoEm) e
-- repointa só os processos daquele grupo pra ela.
-- COLLATE explícito: sem isso a tabela nasce com a collation padrão do banco
-- (utf8mb4_0900_ai_ci nesta versão do MySQL), diferente da collation usada
-- pelas tabelas do projeto (utf8mb4_unicode_ci) — o JOIN contra `interessados`/
-- `processos` logo abaixo falha com "Illegal mix of collations".
CREATE TABLE `_tmp_interessado_fork_map` (
  `old_interessado_id` VARCHAR(191) NOT NULL,
  `grupo_id` VARCHAR(191) NOT NULL,
  `new_interessado_id` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`old_interessado_id`, `grupo_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `_tmp_interessado_fork_map` (`old_interessado_id`, `grupo_id`, `new_interessado_id`)
SELECT DISTINCT p.interessado_id, p.grupo_id, UUID()
FROM `processos` p
JOIN `interessados` i ON i.id = p.interessado_id
WHERE p.interessado_id IS NOT NULL
  AND p.grupo_id <> i.grupo_id;

INSERT INTO `interessados` (`id`, `valor`, `valor_hash`, `ativo`, `criadoEm`, `grupo_id`)
SELECT m.new_interessado_id, i.valor, i.valor_hash, i.ativo, i.criadoEm, m.grupo_id
FROM `_tmp_interessado_fork_map` m
JOIN `interessados` i ON i.id = m.old_interessado_id;

UPDATE `processos` p
JOIN `_tmp_interessado_fork_map` m
  ON m.old_interessado_id = p.interessado_id AND m.grupo_id = p.grupo_id
SET p.interessado_id = m.new_interessado_id;

DROP TABLE `_tmp_interessado_fork_map`;

CREATE UNIQUE INDEX `interessados_valor_hash_grupo_id_key` ON `interessados`(`valor_hash`, `grupo_id`);
CREATE INDEX `interessados_grupo_id_idx` ON `interessados`(`grupo_id`);
ALTER TABLE `interessados` ADD CONSTRAINT `interessados_grupo_id_fkey`
  FOREIGN KEY (`grupo_id`) REFERENCES `grupos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- 2. unidades_grupo: tabela nova, só pra remetente/destino de processo
-- ============================================================
CREATE TABLE `unidades_grupo` (
  `id` VARCHAR(191) NOT NULL,
  `nome` VARCHAR(191) NOT NULL,
  `sigla` VARCHAR(191) NOT NULL,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `grupo_id` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `unidades_grupo_nome_grupo_id_key` ON `unidades_grupo`(`nome`, `grupo_id`);
CREATE UNIQUE INDEX `unidades_grupo_sigla_grupo_id_key` ON `unidades_grupo`(`sigla`, `grupo_id`);
CREATE INDEX `unidades_grupo_grupo_id_idx` ON `unidades_grupo`(`grupo_id`);
ALTER TABLE `unidades_grupo` ADD CONSTRAINT `unidades_grupo_grupo_id_fkey`
  FOREIGN KEY (`grupo_id`) REFERENCES `grupos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- As FKs antigas de processos (apontando pra `unidades`) saem ANTES de
-- repontar os valores abaixo pra `unidades_grupo` — senão a FK antiga rejeita
-- o UPDATE (o novo id não existe em `unidades`). A FK nova (apontando pra
-- `unidades_grupo`) só entra no fim, depois que todo processo já foi
-- repontado.
ALTER TABLE `processos` DROP FOREIGN KEY `processos_unidade_remetente_id_fkey`;
ALTER TABLE `processos` DROP FOREIGN KEY `processos_unidade_destino_id_fkey`;

-- Popular unidades_grupo: uma linha por par (unidade, grupo) realmente usado
-- como remetente OU destino em processo hoje (cobre fork automaticamente —
-- se uma unidade for usada por >1 grupo, cada par vira uma linha própria).
-- Mesmo motivo do COLLATE explícito em `_tmp_interessado_fork_map` acima.
CREATE TABLE `_tmp_unidade_grupo_map` (
  `old_unidade_id` VARCHAR(191) NOT NULL,
  `grupo_id` VARCHAR(191) NOT NULL,
  `new_id` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`old_unidade_id`, `grupo_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `_tmp_unidade_grupo_map` (`old_unidade_id`, `grupo_id`, `new_id`)
SELECT DISTINCT unidade_id, grupo_id, UUID()
FROM (
  SELECT unidade_remetente_id AS unidade_id, grupo_id FROM `processos` WHERE unidade_remetente_id IS NOT NULL
  UNION
  SELECT unidade_destino_id AS unidade_id, grupo_id FROM `processos` WHERE unidade_destino_id IS NOT NULL
) pares;

INSERT INTO `unidades_grupo` (`id`, `nome`, `sigla`, `ativo`, `criadoEm`, `atualizadoEm`, `grupo_id`)
SELECT m.new_id, u.nome, u.sigla, u.ativo, u.criadoEm, NOW(3), m.grupo_id
FROM `_tmp_unidade_grupo_map` m
JOIN `unidades` u ON u.id = m.old_unidade_id;

-- Repointar processos.unidade_remetente_id / unidade_destino_id pras novas
-- linhas de unidades_grupo (antes de trocar a FK de alvo).
UPDATE `processos` p
JOIN `_tmp_unidade_grupo_map` m
  ON m.old_unidade_id = p.unidade_remetente_id AND m.grupo_id = p.grupo_id
SET p.unidade_remetente_id = m.new_id;

UPDATE `processos` p
JOIN `_tmp_unidade_grupo_map` m
  ON m.old_unidade_id = p.unidade_destino_id AND m.grupo_id = p.grupo_id
SET p.unidade_destino_id = m.new_id;

DROP TABLE `_tmp_unidade_grupo_map`;

-- ============================================================
-- 3. processos.unidade_remetente_id / unidade_destino_id: FK nova, agora
--    apontando pra `unidades_grupo` (a antiga já foi derrubada acima, antes
--    do repoint). O campo em si não muda de nome.
-- ============================================================
ALTER TABLE `processos` ADD CONSTRAINT `processos_unidade_remetente_id_fkey`
  FOREIGN KEY (`unidade_remetente_id`) REFERENCES `unidades_grupo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `processos` ADD CONSTRAINT `processos_unidade_destino_id_fkey`
  FOREIGN KEY (`unidade_destino_id`) REFERENCES `unidades_grupo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- `processos.unidade_id` (quem cadastrou) e `usuarios.unidade_id` continuam
-- apontando pra `unidades` (catálogo global) sem nenhuma mudança.
