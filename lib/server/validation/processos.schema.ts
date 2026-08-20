import { z } from 'zod';
import { isoDateString } from './date-string';

/** Porte de CreateProcessoDto (Antares-backend/src/processos/dto/create-processo.dto.ts). */
export const createProcessoSchema = z.object({
  numero_sei: z.string().min(3, 'Número SEI deve ter ao menos 3 caracteres.').optional(),
  assunto: z
    .string()
    .min(5, 'Assunto deve ter ao menos 5 caracteres.')
    .max(5000, 'Assunto deve ter no máximo 5000 caracteres.')
    .optional(),
  origem: z.string().min(2, 'Origem deve ter ao menos 2 caracteres.').optional(),
  interessado_id: z.string().uuid('ID do interessado deve ser um UUID válido.').optional(),
  unidade_remetente_id: z.string().uuid('ID da unidade remetente deve ser um UUID válido.').optional(),
  unidade_destino_id: z.string().uuid('ID da unidade destinatária deve ser um UUID válido.').optional(),
  data_recebimento: isoDateString('Data de recebimento deve ser uma data válida.').optional(),
  data_envio_unidade: isoDateString('Data de envio para unidade deve ser uma data válida.').optional(),
  prazo: isoDateString('Prazo deve ser uma data válida.').optional(),
  data_prorrogacao: isoDateString('Data de prorrogação deve ser uma data válida.').optional(),
  resposta_final: z.string().optional(),
  data_resposta_final: isoDateString('Data de resposta final deve ser uma data válida.').optional(),
  usuario_atribuido_id: z.string().uuid('ID do usuário atribuído deve ser um UUID válido.').optional(),
});

/**
 * Porte de UpdateProcessoDto (PartialType de CreateProcessoDto + campos alternativos
 * `interessado`/`unidade_remetente`/`unidade_destino` sem validação no DTO original).
 */
export const updateProcessoSchema = createProcessoSchema.partial().extend({
  interessado: z.string().optional(),
  unidade_remetente: z.string().optional(),
  unidade_destino: z.string().optional(),
});

/** Porte de CreateRespostaFinalDto (Antares-backend/src/processos/dto/create-resposta-final.dto.ts). */
export const createRespostaFinalSchema = z.object({
  processo_id: z.string(),
  data_resposta_final: isoDateString('Data de resposta final deve ser uma data válida.'),
  resposta_final: z.string().min(10, 'Resposta deve ter ao menos 10 caracteres.'),
  unidade_respondida_id: z.string().min(2, 'Unidade respondida deve ter ao menos 2 caracteres.'),
});

export type CreateProcessoInput = z.infer<typeof createProcessoSchema>;
export type UpdateProcessoInput = z.infer<typeof updateProcessoSchema>;
export type CreateRespostaFinalInput = z.infer<typeof createRespostaFinalSchema>;
