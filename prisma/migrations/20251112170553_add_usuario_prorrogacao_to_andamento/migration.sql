-- AlterTable
ALTER TABLE `andamentos` ADD COLUMN `usuario_prorrogacao_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `andamentos` ADD CONSTRAINT `andamentos_usuario_prorrogacao_id_fkey` FOREIGN KEY (`usuario_prorrogacao_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
