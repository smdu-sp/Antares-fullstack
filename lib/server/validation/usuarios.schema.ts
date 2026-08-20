import { z } from 'zod';
import { Permissao } from '@prisma/client';

/** Porte de CreateUsuarioDto (Antares-backend/src/usuarios/dto/create-usuario.dto.ts). */
export const createUsuarioSchema = z.object({
  nome: z
    .string({ invalid_type_error: 'Tem de ser texto.' })
    .min(10, 'Nome tem de ter ao menos 10 caracteres.'),
  nomeSocial: z
    .string({ invalid_type_error: 'Tem de ser texto.' })
    .min(10, 'Nome social tem de ter ao menos 10 caracteres.')
    .optional(),
  login: z
    .string({ invalid_type_error: 'Login inválido!' })
    .min(7, 'Login tem de ter ao menos 7 caracteres.'),
  email: z.string({ invalid_type_error: 'Login inválido!' }).email('Login tem de ter ao menos 7 caracteres.'),
  permissao: z.nativeEnum(Permissao, { errorMap: () => ({ message: 'Escolha uma permissão válida.' }) }).optional(),
  status: z.boolean({ invalid_type_error: 'Status inválido!' }).optional(),
  avatar: z.string({ invalid_type_error: 'Tem de ser texto.' }).optional(),
  unidade_id: z.string({ invalid_type_error: 'ID da unidade deve ser texto.' }),
});

/** Porte de UpdateUsuarioDto (PartialType de CreateUsuarioDto). */
export const updateUsuarioSchema = createUsuarioSchema.partial();

/** Porte de AtualizarPermissoesDevDto (Antares-backend/src/usuarios/dto/atualizar-permissoes-dev.dto.ts). */
export const atualizarPermissoesDevSchema = z.object({
  permissao: z.nativeEnum(Permissao).optional(),
  status: z.boolean().optional(),
});

export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;
export type AtualizarPermissoesDevInput = z.infer<typeof atualizarPermissoesDevSchema>;
