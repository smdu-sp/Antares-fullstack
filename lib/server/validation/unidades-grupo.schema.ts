import { z } from 'zod';

/** Espelha createUnidadeSchema (unidades.schema.ts) — mesmo formato, tabela por-grupo diferente. */
export const createUnidadeGrupoSchema = z.object({
  nome: z
    .string({ invalid_type_error: 'Nome deve ser texto.' })
    .min(3, 'Nome deve ter ao menos 3 caracteres.'),
  sigla: z
    .string({ invalid_type_error: 'Sigla deve ser texto.' })
    .min(2, 'Sigla deve ter ao menos 2 caracteres.')
    .max(20, 'Sigla deve ter no máximo 20 caracteres.'),
});

export const updateUnidadeGrupoSchema = createUnidadeGrupoSchema.partial();

export type CreateUnidadeGrupoInput = z.infer<typeof createUnidadeGrupoSchema>;
export type UpdateUnidadeGrupoInput = z.infer<typeof updateUnidadeGrupoSchema>;
