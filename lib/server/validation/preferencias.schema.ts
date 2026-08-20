import { z } from 'zod';

/** Porte de SalvarPreferenciaDto (Antares-backend/src/preferencias/dto/salvar-preferencia.dto.ts). */
export const salvarPreferenciaSchema = z.object({
  chave: z.string().min(1),
  valor: z.string().min(1),
});

export type SalvarPreferenciaInput = z.infer<typeof salvarPreferenciaSchema>;
