import { z } from 'zod';
import { StatusAndamento } from '@prisma/client';
import { isoDateString } from './date-string';

/** Porte de CreateAndamentoDto (Antares-backend/src/andamentos/dto/create-andamento.dto.ts). */
export const createAndamentoSchema = z.object({
  processo_id: z.string(),
  origem: z.string().min(2, 'Origem deve ter ao menos 2 caracteres.'),
  destino: z.string().min(2, 'Destino deve ter ao menos 2 caracteres.'),
  data_envio: isoDateString('Data de envio deve ser uma data válida.').optional(),
  prazo: isoDateString('Prazo deve ser uma data válida.').optional(),
  status: z.nativeEnum(StatusAndamento, { errorMap: () => ({ message: 'Status inválido.' }) }).optional(),
  observacao: z.string().optional(),
  assunto: z.string().optional(),
});

/**
 * Porte de UpdateAndamentoDto — PartialType de CreateAndamentoDto + `prorrogacao`/`resposta`
 * (aceitam string ISO ou `null` para limpar o campo). `status` não é atualizável manualmente
 * (o service original ignora esse campo do payload — ver lib/server/andamentos/atualizar.ts).
 */
export const updateAndamentoSchema = createAndamentoSchema.partial().extend({
  prorrogacao: z.string().nullable().optional(),
  resposta: z.string().nullable().optional(),
  // Campos extras tolerados pelo service original via normalização de payload
  // (ver AndamentosService.atualizar): `conclusao` como sinônimo de `resposta`.
  conclusao: z.string().nullable().optional(),
});

/** Porte de BatchAndamentoDto (Antares-backend/src/andamentos/dto/batch-andamento.dto.ts). */
export const batchAndamentoSchema = z.object({
  ids: z.array(z.string().min(1, 'Cada ID deve ser não vazio.')).min(1, 'Deve haver pelo menos um ID.'),
  operacao: z.enum(['excluir', 'prorrogar', 'concluir'], {
    errorMap: () => ({ message: 'Operação deve ser texto.' }),
  }),
  novaDataLimite: isoDateString('Nova data limite deve ser uma data válida.').optional(),
  prazo: isoDateString('Prazo deve ser uma data válida.').optional(),
});

export type CreateAndamentoInput = z.infer<typeof createAndamentoSchema>;
export type UpdateAndamentoInput = z.infer<typeof updateAndamentoSchema>;
export type BatchAndamentoInput = z.infer<typeof batchAndamentoSchema>;
