-- AlterTable
-- Reconcilia o histórico de migrations com o estado real do banco: a coluna
-- `interessados.valor` já está em VARCHAR(768) em produção/dev há tempos
-- (ampliada em algum momento fora do fluxo de migrations), mas nenhuma
-- migration documentava essa mudança. Esta migration só registra o que já
-- é verdade — não altera dados.
ALTER TABLE `interessados` MODIFY `valor` VARCHAR(768) NOT NULL;
