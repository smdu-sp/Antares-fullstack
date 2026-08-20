import { z } from 'zod';

/** Porte de CreateUnidadeDto (Antares-backend/src/unidades/dto/create-unidade.dto.ts). */
export const createUnidadeSchema = z.object({
  nome: z
    .string({ invalid_type_error: 'Nome deve ser texto.' })
    .min(3, 'Nome deve ter ao menos 3 caracteres.'),
  sigla: z
    .string({ invalid_type_error: 'Sigla deve ser texto.' })
    .min(2, 'Sigla deve ter ao menos 2 caracteres.')
    .max(20, 'Sigla deve ter no máximo 20 caracteres.'),
});

/** Porte de UpdateUnidadeDto (PartialType de CreateUnidadeDto). */
export const updateUnidadeSchema = createUnidadeSchema.partial();

export type CreateUnidadeInput = z.infer<typeof createUnidadeSchema>;
export type UpdateUnidadeInput = z.infer<typeof updateUnidadeSchema>;
