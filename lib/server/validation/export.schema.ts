import { z } from 'zod';

/** Porte de ExportParamsDto (Antares-backend/src/export/dto/export-params.dto.ts). */
export const exportParamsSchema = z.object({
  ids: z.array(z.string()).optional(),
  busca: z.string().optional(),
  interessado: z.string().optional(),
  unidadeRemetente: z.string().optional(),
  unidadeDestino: z.string().optional(),
  vencendoHoje: z.boolean().optional(),
  atrasados: z.boolean().optional(),
  concluidos: z.boolean().optional(),
  incluirProcesso: z.boolean().optional(),
  incluirAndamentos: z.boolean().optional(),
});

export type ExportParamsInput = z.infer<typeof exportParamsSchema>;
