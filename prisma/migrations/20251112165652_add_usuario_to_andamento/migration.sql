/*
  Warnings:

  - Added the required column `usuario_id` to the `andamentos` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add column as nullable first
ALTER TABLE `andamentos` ADD COLUMN `usuario_id` VARCHAR(191) NULL;

-- Step 2: Populate existing records with the first user (or a default user)
-- Using the first user found in the usuarios table
UPDATE `andamentos` 
SET `usuario_id` = (SELECT `id` FROM `usuarios` LIMIT 1)
WHERE `usuario_id` IS NULL;

-- Step 3: Make the column NOT NULL
ALTER TABLE `andamentos` MODIFY COLUMN `usuario_id` VARCHAR(191) NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE `andamentos` ADD CONSTRAINT `andamentos_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
