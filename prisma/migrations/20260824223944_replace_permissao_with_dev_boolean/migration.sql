-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `dev` BOOLEAN NOT NULL DEFAULT false;

-- Backfill: quem tinha permissao='DEV' vira dev=true; ADM/TEC/USR eram inertes, viram dev=false.
UPDATE `usuarios` SET `dev` = true WHERE `permissao` = 'DEV';

-- DropColumn
ALTER TABLE `usuarios` DROP COLUMN `permissao`;
