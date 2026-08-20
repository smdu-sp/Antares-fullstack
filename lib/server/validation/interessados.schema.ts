import { z } from 'zod';

/** Porte de CreateInteressadoDto (Antares-backend/src/interessados/dto/create-interessado.dto.ts). */
export const createInteressadoSchema = z.object({
  valor: z
    .string({ invalid_type_error: 'Nome deve ser texto.' })
    .min(3, 'Nome deve ter ao menos 3 caracteres.')
    .max(255, 'Nome deve ter no máximo 255 caracteres.'),
});

/** Porte de UpdateInteressadoDto (PartialType de CreateInteressadoDto). */
export const updateInteressadoSchema = createInteressadoSchema.partial();

export type CreateInteressadoInput = z.infer<typeof createInteressadoSchema>;
export type UpdateInteressadoInput = z.infer<typeof updateInteressadoSchema>;
