-- AlterTable
ALTER TABLE `processos` ADD COLUMN `unidade_destino_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `processos` ADD CONSTRAINT `processos_unidade_destino_id_fkey` FOREIGN KEY (`unidade_destino_id`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
