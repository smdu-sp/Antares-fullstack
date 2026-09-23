-- unidade_remetente_id/unidadeRemetente não estava em uso (confirmado pelo
-- usuário) — o campo `origem` (texto livre) já cumpria esse papel na prática.
-- Remove o vínculo com UnidadeGrupo; `origem` continua como está (só o
-- rótulo na UI muda pra "Unidade Remetente", sem mudança de schema aqui).
ALTER TABLE `processos` DROP FOREIGN KEY `processos_unidade_remetente_id_fkey`;
ALTER TABLE `processos` DROP COLUMN `unidade_remetente_id`;
