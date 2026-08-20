import { z } from 'zod';

/** Porte de DefinirGrupoAtivoDto (Antares-backend/src/auth/models/definir-grupo-ativo.dto.ts). */
export const definirGrupoAtivoSchema = z.object({
  grupoId: z.string().uuid('grupoId deve ser um UUID valido.'),
});

export type DefinirGrupoAtivoInput = z.infer<typeof definirGrupoAtivoSchema>;
